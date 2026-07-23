// ==================== 3D АНИМИРОВАННЫЙ ФОН ====================

let scene, camera, renderer, system, bulp;

function initBackground() {
    // S C E N E
    scene = new THREE.Scene();

    // C A M E R A
    camera = new THREE.PerspectiveCamera(10, window.innerWidth / window.innerHeight, 0.0001, 1000);
    camera.lookAt(scene.position);
    camera.position.set(0, 0, 150);
    scene.add(camera);

    // R E N D E R E R
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    const stage = document.querySelector('[data-js="stage"]');
    if (stage) {
        stage.appendChild(renderer.domElement);
    }

    // L I G H T — оранжево-жёлтый
    bulp = new THREE.PointLight(0xf0883e, 1, 10000);
    bulp.position.set(0, 0, 5);
    scene.add(bulp);

    // S Y S T E M
    system = new THREE.Group();
    scene.add(system);

    // G E M — оранжево-жёлтый wireframe
    const gemMaterial = new THREE.MeshBasicMaterial({
        wireframe: true,
        color: 0xf5c842,
        transparent: true,
        opacity: 0.15
    });

    const gem = new THREE.Mesh(
        new THREE.OctahedronGeometry(8, 1),
        gemMaterial
    );
    system.add(gem);

    // P O I N T S — белые точки на вершинах
    const positions = gem.geometry.attributes.position;
    const pointMaterial = new THREE.MeshBasicMaterial({
        color: 0xffd700
    });

    for (let i = 0; i < positions.count; i++) {
        const point = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.5, 1),
            pointMaterial
        );
        
        point.position.set(
            positions.getX(i),
            positions.getY(i),
            positions.getZ(i)
        );
        system.add(point);
    }

    // A N I M A T I O N — вращение
    gsap.to(system.rotation, {
        ease: "none",
        x: Math.PI * 2,
        y: Math.PI * 2,
        duration: 15,
        repeat: -1
    });

    // G L O W — пульсация свечения
    gsap.to(bulp, {
        ease: "none",
        intensity: 0.3,
        duration: 2,
        repeat: -1,
        yoyo: true
    });

    gsap.to(gemMaterial, {
        ease: "none",
        opacity: 0.05,
        duration: 2,
        repeat: -1,
        yoyo: true
    });

    // R E S I Z E
    window.addEventListener('resize', () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    });

    // R E N D E R
    function render() {
        requestAnimationFrame(render);
        renderer.render(scene, camera);
    }
    render();
}

// Запускаем после загрузки
document.addEventListener('DOMContentLoaded', initBackground);