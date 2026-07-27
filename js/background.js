// ==================== 3D АНИМИРОВАННЫЙ ФОН СО СВЕЧЕНИЕМ ====================

let scene, camera, renderer, system, bulp, glowSphere;

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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    const stage = document.querySelector('[data-js="stage"]');
    if (stage) {
        stage.appendChild(renderer.domElement);
    }

    // L I G H T
    bulp = new THREE.PointLight(0xf0883e, 1.5, 50);
    bulp.position.set(0, 0, 8);
    scene.add(bulp);

    const ambientLight = new THREE.AmbientLight(0xf5c842, 0.3);
    scene.add(ambientLight);

    // S Y S T E M
    system = new THREE.Group();
    scene.add(system);

    // GLOW SPHERE
    const glowGeometry = new THREE.SphereGeometry(11, 32, 32);
    const glowMaterial = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uColor: { value: new THREE.Color('#f0883e') },
            uOpacity: { value: 0.3 }
        },
        vertexShader: `
            varying vec3 vNormal;
            varying vec3 vPosition;
            void main() {
                vNormal = normalize(normalMatrix * normal);
                vPosition = position;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            varying vec3 vNormal;
            varying vec3 vPosition;
            uniform float uTime;
            uniform vec3 uColor;
            uniform float uOpacity;
            void main() {
                float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.5);
                float pulse = 1.0 + sin(uTime * 2.0) * 0.3;
                gl_FragColor = vec4(uColor, intensity * uOpacity * pulse);
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    
    glowSphere = new THREE.Mesh(glowGeometry, glowMaterial);
    system.add(glowSphere);

    // G E M
    const gemMaterial = new THREE.MeshBasicMaterial({
        wireframe: true,
        color: 0xf5c842,
        transparent: true,
        opacity: 0.2
    });

    const gem = new THREE.Mesh(
        new THREE.OctahedronGeometry(8, 1),
        gemMaterial
    );
    system.add(gem);

    // P O I N T S
    const positions = gem.geometry.attributes.position;
    const pointMaterial = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        emissive: 0xffd700,
        emissiveIntensity: 0.8,
        roughness: 0.3,
        metalness: 0.5
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

    // P A R T I C L E S
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 160;
    const particlesPositions = new Float32Array(particlesCount * 3);
    
    for (let i = 0; i < particlesCount; i++) {
        const angle = (i / particlesCount) * Math.PI * 2;
        const radius = 12 + Math.random() * 3;
        const height = (Math.random() - 0.5) * 8;
        
        particlesPositions[i * 3] = Math.cos(angle) * radius;
        particlesPositions[i * 3 + 1] = height;
        particlesPositions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlesPositions, 3));
    
    const particlesMaterial = new THREE.PointsMaterial({
        color: 0xf5c842,
        size: 0.3,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    system.add(particles);

    // A N I M A T I O N
    gsap.to(system.rotation, {
        ease: "none",
        x: Math.PI * 2,
        y: Math.PI * 2,
        duration: 20,
        repeat: -1
    });

    gsap.to(particles.rotation, {
        ease: "none",
        y: -Math.PI * 2,
        duration: 15,
        repeat: -1
    });

    gsap.to(bulp, {
        ease: "none",
        intensity: 0.5,
        duration: 2,
        repeat: -1,
        yoyo: true
    });

    gsap.to(gemMaterial, {
        ease: "none",
        opacity: 0.08,
        duration: 2,
        repeat: -1,
        yoyo: true
    });

    gsap.to(glowMaterial.uniforms.uOpacity, {
        ease: "none",
        value: 0.5,
        duration: 2.5,
        repeat: -1,
        yoyo: true
    });

    function updateGlow() {
        glowMaterial.uniforms.uTime.value += 0.016;
        requestAnimationFrame(updateGlow);
    }
    updateGlow();

    // 🔥 ФУНКЦИИ ДЛЯ ПЕРЕКЛЮЧЕНИЯ ЭКРАНОВ
    window.zoomOutCamera = function() {
        return new Promise((resolve) => {
            gsap.to(camera.position, {
                z: 300,
                duration: 1.2,
                ease: "power2.inOut",
                onComplete: resolve
            });
        });
    };
    
    window.zoomInCamera = function() {
        return new Promise((resolve) => {
            gsap.to(camera.position, {
                z: 150,
                duration: 1.2,
                ease: "power2.inOut",
                onComplete: resolve
            });
        });
    };

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

document.addEventListener('DOMContentLoaded', initBackground);