import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const BIN_GAP = 8;       // spacing between bins along X

/**
 * Create a billboard text sprite sized to fit `text`. The returned sprite has
 * its scale set to (textAspect, 1, 1) so the caller can multiply by a single
 * "label height" scalar to size it in world units without squashing text.
 */
function makeSpriteLabel(text) {
  const fontSize = 32;
  const fontStack = 'ui-monospace, Menlo, monospace';
  const padX = 14;
  const padY = 8;

  // Measure first.
  const measure = document.createElement('canvas').getContext('2d');
  measure.font = `bold ${fontSize}px ${fontStack}`;
  const textWidth = Math.ceil(measure.measureText(text).width);

  const cssW = textWidth + padX * 2;
  const cssH = fontSize + padY * 2;

  const dpr = window.devicePixelRatio || 1;
  const canvas = document.createElement('canvas');
  canvas.width = cssW * dpr;
  canvas.height = cssH * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  // Pill background
  ctx.fillStyle = 'rgba(15, 17, 21, 0.85)';
  const r = 6;
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(0, 0, cssW, cssH, r);
    ctx.fill();
  } else {
    ctx.fillRect(0, 0, cssW, cssH);
  }

  // Text
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${fontSize}px ${fontStack}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, cssW / 2, cssH / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);

  const aspect = cssW / cssH;
  sprite.scale.set(aspect, 1, 1);
  sprite.userData.aspect = aspect;
  return sprite;
}

function setLabelHeight(sprite, height) {
  const aspect = sprite.userData.aspect ?? 2;
  sprite.scale.set(aspect * height, height, 1);
}

function hashColor(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return `hsl(${hue}, 60%, 55%)`;
}

export class Scene {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0c12);

    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 5000);
    this.camera.position.set(80, 60, 80);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.target.set(0, 10, 0);

    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(50, 100, 30);
    this.scene.add(ambient, dir);

    // Ground grid for spatial reference
    this.grid = new THREE.GridHelper(400, 80, 0x2a3148, 0x1d2231);
    this.grid.position.y = -0.01;
    this.scene.add(this.grid);

    this.contentGroup = new THREE.Group();
    this.scene.add(this.contentGroup);
    this.labelsGroup = new THREE.Group();
    this.scene.add(this.labelsGroup);

    this.labelsVisible = false;

    window.addEventListener('resize', () => this.onResize());
    this.onResize();
    this.animate();
  }

  onResize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.renderer.setSize(rect.width, rect.height, false);
    this.camera.aspect = rect.width / rect.height;
    this.camera.updateProjectionMatrix();
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  clear() {
    for (const group of [this.contentGroup, this.labelsGroup]) {
      while (group.children.length) {
        const c = group.children.pop();
        c.geometry?.dispose?.();
        c.material?.dispose?.();
        c.material?.map?.dispose?.();
      }
    }
  }

  setLabelsVisible(visible) {
    this.labelsVisible = visible;
    this.labelsGroup.visible = visible;
  }

  /** Render the result. `result.bins` is an array of BinResult. */
  render(result) {
    this.clear();
    if (!result || !result.bins || result.bins.length === 0) return;

    // Layout bins along X with a gap.
    let cursorX = 0;
    let maxExtent = 0;
    const groupColors = new Map();

    for (const bin of result.bins) {
      const [bw, bh, bd] = bin.whd;

      const binBase = new THREE.Group();
      binBase.position.set(cursorX, 0, -bd / 2);
      this.contentGroup.add(binBase);

      // Bin wireframe
      const wfGeom = new THREE.BoxGeometry(bw, bh, bd);
      const edges = new THREE.EdgesGeometry(wfGeom);
      const lineMat = new THREE.LineBasicMaterial({ color: 0x4f8cff, transparent: true, opacity: 0.65 });
      const wf = new THREE.LineSegments(edges, lineMat);
      wf.position.set(bw / 2, bh / 2, bd / 2);
      binBase.add(wf);
      wfGeom.dispose();

      // Bin label
      const binLabel = makeSpriteLabel(bin.partno);
      const binLabelHeight = Math.max(2, Math.min(bw, bd) * 0.18);
      setLabelHeight(binLabel, binLabelHeight);
      binLabel.position.set(bw / 2, bh + binLabelHeight * 0.8, bd / 2);
      binBase.add(binLabel);

      // Items inside the bin
      for (const item of bin.fittedItems) {
        const [iw, ih, id] = item.rotatedWhd;
        const [px, py, pz] = item.position;

        let color = item.color || '#888888';
        if (item.partno && item.partno.startsWith('__group:')) color = hashColor(item.partno);

        const mat = new THREE.MeshLambertMaterial({
          color,
          transparent: true,
          opacity: 0.9,
        });
        const geom = new THREE.BoxGeometry(iw, ih, id);
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(px + iw / 2, py + ih / 2, pz + id / 2);
        binBase.add(mesh);

        // Outline
        const edgesGeom = new THREE.EdgesGeometry(geom);
        const outline = new THREE.LineSegments(
          edgesGeom,
          new THREE.LineBasicMaterial({
            color: item.fragile ? 0xff5252 : item.nonStackable ? 0xffcc66 : 0x0a0c12,
            linewidth: 1,
          }),
        );
        outline.position.copy(mesh.position);
        binBase.add(outline);

        // Load order label
        const lbl = makeSpriteLabel(String(item.loadOrder));
        const lblHeight = Math.max(1.2, Math.min(iw, id) * 0.4);
        setLabelHeight(lbl, lblHeight);
        lbl.position.set(px + iw / 2, py + ih + lblHeight * 0.7, pz + id / 2);
        this.labelsGroup.add(lbl);
      }

      cursorX += bw + BIN_GAP;
      maxExtent = Math.max(maxExtent, bw, bh, bd);
    }

    this.labelsGroup.visible = this.labelsVisible;
    this.fitCameraToContent(cursorX, maxExtent);
  }

  fitCameraToContent(totalWidth, maxExtent) {
    const dist = Math.max(totalWidth, maxExtent) * 1.4 + 20;
    this.camera.position.set(totalWidth * 0.6, dist * 0.6, dist);
    this.controls.target.set(totalWidth / 2 - BIN_GAP / 2, maxExtent * 0.3, 0);
    this.controls.update();
  }

  resetCamera() {
    // Recompute fit based on current content bbox
    const box = new THREE.Box3().setFromObject(this.contentGroup);
    if (box.isEmpty()) {
      this.camera.position.set(80, 60, 80);
      this.controls.target.set(0, 10, 0);
    } else {
      const center = new THREE.Vector3();
      box.getCenter(center);
      const size = new THREE.Vector3();
      box.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z);
      const dist = maxDim * 1.6 + 20;
      this.camera.position.set(center.x + dist * 0.6, center.y + dist * 0.6, center.z + dist);
      this.controls.target.copy(center);
    }
    this.controls.update();
  }
}
