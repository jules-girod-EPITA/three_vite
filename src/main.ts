import GUI from 'lil-gui'
import {
  AmbientLight,
  AxesHelper,
  BoxGeometry,
  Clock,
  GridHelper,
  LoadingManager,
  Mesh,
  MeshLambertMaterial,
  MeshStandardMaterial,
  Object3D,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  PointLightHelper,
  Scene,
  WebGLRenderer,
} from 'three'
import {DragControls} from 'three/examples/jsm/controls/DragControls'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls'
import Stats from 'three/examples/jsm/libs/stats.module'
import * as animations from './helpers/animations'
import {toggleFullScreen} from './helpers/fullscreen'
import {resizeRendererToDisplaySize} from './helpers/responsiveness'
import './style.css'
import {initController} from "./controller/controller";
import {getRoadsLine} from "./terrain/road";
import { checkCollisions } from "./collision/collision";

class Player extends Object3D {
  private onUpdate: () => void;

  constructor(onUpdate: () => void) {
    super();
    this.onUpdate = onUpdate;
  }

  updateMatrixWorld(force?: boolean): void {

    super.updateMatrixWorld(force);
    this.onUpdate();
  }
}


const CANVAS_ID = 'scene'

let canvas: HTMLElement
let renderer: WebGLRenderer
export let scene: Scene
let loadingManager: LoadingManager
let ambientLight: AmbientLight
let pointLight: PointLight
let cube: Mesh
export let player: Player
export let camera: PerspectiveCamera
let cameraControls: OrbitControls
let dragControls: DragControls
let axesHelper: AxesHelper
let pointLightHelper: PointLightHelper
export let clock: Clock
let stats: Stats
let gui: GUI
export const sideLength = 1

const animation = { enabled: true, play: true }

init()
animate()

function init() {
  // ===== 🖼️ CANVAS, RENDERER, & SCENE =====
  {
    canvas = document.querySelector(`canvas#${CANVAS_ID}`)!
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = PCFSoftShadowMap
    scene = new Scene()
  }

  // ===== 👨🏻‍💼 LOADING MANAGER =====
  {
    loadingManager = new LoadingManager()

    loadingManager.onStart = () => {
      console.log('loading started')
    }
    loadingManager.onProgress = (url, loaded, total) => {
      console.log('loading in progress:')
      console.log(`${url} -> ${loaded} / ${total}`)
    }
    loadingManager.onLoad = () => {
      console.log('loaded!')
    }
    loadingManager.onError = () => {
      console.log('❌ error while loading')
    }
  }

  // ===== 💡 LIGHTS =====
  {
    ambientLight = new AmbientLight('white', 0.4)
    pointLight = new PointLight('white', 20, 100)
    pointLight.position.set(-2, 2, 2)
    pointLight.castShadow = true
    pointLight.shadow.radius = 4
    pointLight.shadow.camera.near = 0.5
    pointLight.shadow.camera.far = 4000
    pointLight.shadow.mapSize.width = 2048
    pointLight.shadow.mapSize.height = 2048
    scene.add(ambientLight)
    scene.add(pointLight)
  }

  // ===== 📦 OBJECTS =====
  {
    const cubeGeometry = new BoxGeometry(sideLength, sideLength, sideLength)
    const cubeMaterial = new MeshStandardMaterial({
      color: '#f69f1f',
      metalness: 0.5,
      roughness: 0.7,
    })
    cube = new Mesh(cubeGeometry, cubeMaterial)
    cube.castShadow = true
    cube.position.y = 0.5

    player = new Player(() => {
      cameraControls.target = player.position.clone()
    });
    player.add(cube)

    const planeGeometry = new PlaneGeometry(3, 3)
    const planeMaterial = new MeshLambertMaterial({
      color: 'gray',
      emissive: 'teal',
      emissiveIntensity: 0.2,
      side: 2,
      transparent: true,
      opacity: 0.4,
    })
    const plane = new Mesh(planeGeometry, planeMaterial)
    plane.rotateX(Math.PI / 2)
    plane.receiveShadow = true

    scene.add(player);
    scene.add(plane)
  }


  // === 📦 FBX OBJECT ===
  {
    for(let i = 0; i < 5; i++) {
      getRoadsLine().then((road) => {
        road.position.set(0, 0, i * 2);
        scene.add(road);
      });
    }
  }


  // ==== 🌲 DECORATION ====
  {
    // ==== 🌌 SKYBOX ====
    const skyboxGeometry = new BoxGeometry(100, 100, 100)
    const skyboxMaterial = new MeshStandardMaterial({
      color: 'skyblue',
      side: 1,
    })
    const skybox = new Mesh(skyboxGeometry, skyboxMaterial);
    skybox.material.emissive.set('skyblue')
    scene.add(skybox)


    // ==== 🌳 GROUND ====
    const groundGeometry = new PlaneGeometry(20, 20)
    const groundMaterial = new MeshStandardMaterial({
      color: 'green',
      side: 2,
    })
    const ground = new Mesh(groundGeometry, groundMaterial)
    ground.position.y = -1
    ground.receiveShadow = true
    ground.rotateX(-Math.PI / 2)
    scene.add(ground)
  }

  // ===== 🎥 CAMERA =====
  {
    camera = new PerspectiveCamera(50, canvas.clientWidth / canvas.clientHeight, 0.1, 100)
    camera.position.set(-1, 3, -5)
    player.add(camera)
  }

  // ===== 🕹️ CONTROLS =====
  {
    cameraControls = new OrbitControls(camera, canvas)
    cameraControls.target = cube.position.clone()
    cameraControls.enableDamping = true
    cameraControls.autoRotate = false
    cameraControls.update()

    dragControls = new DragControls([cube], camera, renderer.domElement)
    dragControls.addEventListener('hoveron', (event) => {
      const mesh = event.object as Mesh
      const material = mesh.material as MeshStandardMaterial
      material.emissive.set('orange')
    })
    dragControls.addEventListener('hoveroff', (event) => {
      const mesh = event.object as Mesh
      const material = mesh.material as MeshStandardMaterial
      material.emissive.set('black')
    })
    dragControls.addEventListener('dragstart', (event) => {
      const mesh = event.object as Mesh
      const material = mesh.material as MeshStandardMaterial
      cameraControls.enabled = false
      animation.play = false
      material.emissive.set('black')
      material.opacity = 0.7
      material.needsUpdate = true
    })
    dragControls.addEventListener('dragend', (event) => {
      cameraControls.enabled = true
      animation.play = true
      const mesh = event.object as Mesh
      const material = mesh.material as MeshStandardMaterial
      material.emissive.set('black')
      material.opacity = 1
      material.needsUpdate = true
    })
    dragControls.enabled = false

    // Full screen
    window.addEventListener('dblclick', (event) => {
      if (event.target === canvas) {
        toggleFullScreen(canvas)
      }
    })
  }

  // ===== 🪄 HELPERS =====
  {
    axesHelper = new AxesHelper(4)
    axesHelper.visible = false
    scene.add(axesHelper)

    pointLightHelper = new PointLightHelper(pointLight, undefined, 'orange')
    pointLightHelper.visible = false
    scene.add(pointLightHelper)

    const gridHelper = new GridHelper(20, 20, 'teal', 'darkgray')
    gridHelper.position.y = -0.01
    scene.add(gridHelper)
  }

  // ===== 📈 STATS & CLOCK =====
  {
    clock = new Clock()
    stats = new Stats()
    document.body.appendChild(stats.dom)
  }

  // ==== 🐞 DEBUG GUI ====
  {
    gui = new GUI({ title: '🐞 Debug GUI', width: 300 })
    // open GUI by pressing 'g' key
    window.addEventListener('keydown', (event) => {
      if (event.key === 'g') {
        gui.openAnimated(true);
      }
    })
    const cubeOneFolder = gui.addFolder('Cube one')

    cubeOneFolder.add(cube.position, 'x').min(-5).max(5).step(0.5).name('pos x')
    cubeOneFolder.add(cube.position, 'y').min(-5).max(5).step(0.5).name('pos y')
    cubeOneFolder.add(cube.position, 'z').min(-5).max(5).step(0.5).name('pos z')

    cubeOneFolder.add(cube.material, 'wireframe')
    cubeOneFolder.addColor(cube.material, 'color')
    cubeOneFolder.add(cube.material, 'metalness', 0, 1, 0.1)
    cubeOneFolder.add(cube.material, 'roughness', 0, 1, 0.1)

    let axesHelperOnCube: AxesHelper = new AxesHelper();
    // adding checkbox add or remove the AxisHelper to the cube
    axesHelperOnCube.renderOrder = 1;
    cube.add(axesHelperOnCube);


    cubeOneFolder.add({
      toggleAxisHelper: () => {
        axesHelperOnCube.visible = !axesHelperOnCube.visible;
      }
    }, 'toggleAxisHelper').name('toggle AxisHelper')

    cubeOneFolder
        .add(cube.rotation, 'x', -Math.PI * 2, Math.PI * 2, Math.PI / 4)
        .name('rotate x')
    cubeOneFolder
        .add(cube.rotation, 'y', -Math.PI * 2, Math.PI * 2, Math.PI / 4)
        .name('rotate y')
    cubeOneFolder
        .add(cube.rotation, 'z', -Math.PI * 2, Math.PI * 2, Math.PI / 4)
        .name('rotate z')

    cubeOneFolder.add(animation, 'enabled').name('animated')

    const controlsFolder = gui.addFolder('Controls')
    controlsFolder.add(dragControls, 'enabled').name('drag controls')

    const lightsFolder = gui.addFolder('Lights')
    lightsFolder.add(pointLight, 'visible').name('point light')
    lightsFolder.add(ambientLight, 'visible').name('ambient light')

    const helpersFolder = gui.addFolder('Helpers')
    helpersFolder.add(axesHelper, 'visible').name('axes')
    helpersFolder.add(pointLightHelper, 'visible').name('pointLight')

    const cameraFolder = gui.addFolder('Camera')
    cameraFolder.add(cameraControls, 'autoRotate')

    // persist GUI state in local storage on changes
    gui.onFinishChange(() => {
      const guiState = gui.save()
      localStorage.setItem('guiState', JSON.stringify(guiState))
    })

    // load GUI state if available in local storage
    const guiState = localStorage.getItem('guiState')
    if (guiState) gui.load(JSON.parse(guiState))

    // reset GUI state button
    const resetGui = () => {
      localStorage.removeItem('guiState')
      gui.reset()
    }
    gui.add({ resetGui }, 'resetGui').name('RESET')

    gui.close()
  }


  // ===== 🎮 EVENT LISTENERS =====
  initController()
}

function animate() {
  requestAnimationFrame(animate)

  stats.update()

  // On recupere les voitures
  let cars = [];

  scene.traverse((child) => {
    if (child instanceof Mesh && child.name === "car") {
        cars.push(child);
    }
  });

  // On check les collisions avec le joueur
  checkCollisions(cars, player);

  if (animation.enabled && animation.play) {
    animations.rotate(cube, clock, Math.PI / 3)
    animations.bounce(cube, clock, 1, 0.5, 0.5)
  }

  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement
    camera.aspect = canvas.clientWidth / canvas.clientHeight
    camera.updateProjectionMatrix()
  }


  cameraControls.update()

  renderer.render(scene, camera)
}