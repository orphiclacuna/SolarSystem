import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

class SolarSystem {
  constructor() {
    this.planets = [];
    this.animationSpeed = 1;
    this.isPaused = false;
    this.textureLoader = new THREE.TextureLoader();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.hoveredObject = null;
    this.isMobile = window.innerWidth < 768;
    
    this.init();
    this.createSolarSystem();
    this.setupControls();
    this.setupEventListeners();
    this.animate();
  }

  init() {
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    
    // Set different default camera position based on device type
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      // More zoomed out position for mobile
      this.camera.position.set(0, 50, 130);
    } else {
      // Standard position for desktop
      this.camera.position.set(0, 30, 80);
    }

    this.renderer = new THREE.WebGLRenderer({ 
      antialias: window.devicePixelRatio <= 1,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ReinhardToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    
    document.getElementById('app').appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    
    // Different control limits based on device type
    if (this.isMobile) {
      this.controls.maxDistance = 250; // Limit zoom out range
      this.controls.minDistance = 20;  // Don't let mobile users zoom in too close
    } else {
      this.controls.maxDistance = 500;
      this.controls.minDistance = 10;
    }

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      
      // If this is a device orientation change (mobile), adjust camera position
      const wasMobile = this.isMobile;
      this.isMobile = window.innerWidth < 768;
      
      // If device type changed (mobile/desktop switch), adjust camera accordingly
      if (wasMobile !== this.isMobile) {
        if (this.isMobile) {
          // Don't force position change, just adjust controls limits
          this.controls.maxDistance = 250; // Allow more zoom out on mobile
        } else {
          // Going back to desktop
          this.controls.maxDistance = 500;
        }
      }
    });
  }

  createSolarSystem() {
    this.createStarfield();
    const sunGeometry = new THREE.SphereGeometry(8, 64, 64);
    const sunTexture = this.textureLoader.load('/textures/sun.jpg');
    sunTexture.colorSpace = THREE.SRGBColorSpace;
    
    const sunMaterial = new THREE.MeshBasicMaterial({ 
      map: sunTexture,
      color: 0xffeecc 
    });
    
    this.sun = new THREE.Mesh(sunGeometry, sunMaterial);
    this.scene.add(this.sun);

    const sunLight = new THREE.PointLight(0xffffff, 5, 1000); 
    sunLight.decay = 0; 
    this.scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0x606060, 1.0);
    this.scene.add(ambientLight);

    const planetData = [
      { name: 'Mercury', size: 1.2, distance: 15, speed: 0.02 },
      { name: 'Venus', size: 1.8, distance: 22, speed: 0.015 },
      { name: 'Earth', size: 2.0, distance: 30, speed: 0.01 },
      { name: 'Mars', size: 1.5, distance: 40, speed: 0.008 },
      { name: 'Jupiter', size: 4.5, distance: 55, speed: 0.005 },
      { name: 'Saturn', size: 4.0, distance: 70, speed: 0.004 },
      { name: 'Uranus', size: 3.0, distance: 85, speed: 0.003 },
      { name: 'Neptune', size: 2.8, distance: 100, speed: 0.002 }
    ];
    planetData.forEach((data) => {
      const planet = this.createPlanet(data);
      this.planets.push(planet);
      this.scene.add(planet.group);
      const orbitGeometry = new THREE.RingGeometry(data.distance - 0.2, data.distance + 0.2, 32);
      const orbitMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffffff, 
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.1
      });
      const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
      orbit.rotation.x = Math.PI / 2;
      this.scene.add(orbit);
    });
  }

  createPlanet(data) {
    const group = new THREE.Group();
    
    const geometry = new THREE.SphereGeometry(data.size, 32, 32);
    
    let texturePath = `/textures/${data.name.toLowerCase()}.jpg`;
    const texture = this.textureLoader.load(texturePath);
    
    texture.colorSpace = THREE.SRGBColorSpace;
    
    const material = new THREE.MeshLambertMaterial({ 
      map: texture
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    
    if (data.name === 'Earth') {
      const atmosphereGeometry = new THREE.SphereGeometry(data.size * 1.03, 16, 16);
      const atmosphereMaterial = new THREE.MeshBasicMaterial({
        color: 0x87ceeb,
        transparent: true,
        opacity: 0.1,
        side: THREE.BackSide
      });
      const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
      group.add(atmosphere);
      
      const moonGeometry = new THREE.SphereGeometry(data.size * 0.27, 16, 16); 
      const moonTexture = this.textureLoader.load('/textures/moon.jpg');
      moonTexture.colorSpace = THREE.SRGBColorSpace;
      
      const moonMaterial = new THREE.MeshLambertMaterial({
        map: moonTexture
      });
      
      const moon = new THREE.Mesh(moonGeometry, moonMaterial);
      moon.position.set(data.size * 3, 0, 0); 
      moon.userData.isMoon = true;
      group.add(moon);
      
      group.userData.moon = moon;
    }
    
    if (data.name === 'Saturn') {
      const ringGeometry = new THREE.RingGeometry(data.size * 1.2, data.size * 2, 32);
      
      const ringTexture = this.textureLoader.load('./src/textures/saturn_rings.png');
      ringTexture.colorSpace = THREE.SRGBColorSpace;
      
      const ringMaterial = new THREE.MeshLambertMaterial({
        map: ringTexture,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
        alphaTest: 0.1
      });
      const rings = new THREE.Mesh(ringGeometry, ringMaterial);
      rings.rotation.x = Math.PI / 2;
      rings.rotation.z = Math.PI / 4;
      group.add(rings);
    }
    
    group.add(mesh);
    group.position.x = data.distance;
        
    return {
      group: group,
      mesh: mesh,
      distance: data.distance,
      speed: data.speed,
      angle: Math.random() * Math.PI * 2,
      name: data.name
    };
  }

  createStarfield() {
    const starCanvas = document.createElement('canvas');
    starCanvas.width = 32;
    starCanvas.height = 32;
    const starContext = starCanvas.getContext('2d');
    
    const gradient = starContext.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.9)');
    gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.7)');
    gradient.addColorStop(0.8, 'rgba(255, 255, 255, 0.4)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    starContext.fillStyle = gradient;
    starContext.fillRect(0, 0, 32, 32);
    
    const coreGradient = starContext.createRadialGradient(16, 16, 0, 16, 16, 6);
    coreGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    coreGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)');
    coreGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    starContext.fillStyle = coreGradient;
    starContext.fillRect(0, 0, 32, 32);
    
    const centerGradient = starContext.createRadialGradient(16, 16, 0, 16, 16, 2);
    centerGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    centerGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    starContext.fillStyle = centerGradient;
    starContext.fillRect(0, 0, 32, 32);
    
    const starTexture = new THREE.CanvasTexture(starCanvas);
    
    const starLayers = [
      { count: 1000, distance: [800, 1200], size: 4.0, opacity: 1.0, color: 0xFFFFFF },
      { count: 2000, distance: [1200, 2000], size: 3.5, opacity: 1.0, color: 0xF0F0F0 },
      { count: 3000, distance: [2000, 3500], size: 3.0, opacity: 1.0, color: 0xE0E0E0 },
      { count: 4000, distance: [3500, 5000], size: 2.5, opacity: 0.9, color: 0xD0D0D0 }
    ];

    starLayers.forEach((layer) => {
      const starsGeometry = new THREE.BufferGeometry();
      const starsMaterial = new THREE.PointsMaterial({ 
        map: starTexture,
        color: layer.color, 
        size: layer.size,
        sizeAttenuation: true,
        transparent: true,
        opacity: layer.opacity,
        alphaTest: 0.001
      });

      const starsVertices = [];
      for (let i = 0; i < layer.count; i++) {
        const distance = layer.distance[0] + Math.random() * (layer.distance[1] - layer.distance[0]);
        
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        const x = distance * Math.sin(phi) * Math.cos(theta);
        const y = distance * Math.sin(phi) * Math.sin(theta);
        const z = distance * Math.cos(phi);
        
        starsVertices.push(x, y, z);
      }

      starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
      const stars = new THREE.Points(starsGeometry, starsMaterial);
      this.scene.add(stars);
    });

    const accentStarsGeometry = new THREE.BufferGeometry();
    const accentStarsMaterial = new THREE.PointsMaterial({ 
      map: starTexture,
      color: 0xFFFFFF, 
      size: 8.0,
      sizeAttenuation: true,
      transparent: true,
      opacity: 1.0,
      alphaTest: 0.001
    });

    const accentStarsVertices = [];
    for (let i = 0; i < 150; i++) {
      const distance = 600 + Math.random() * 1200;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      const x = distance * Math.sin(phi) * Math.cos(theta);
      const y = distance * Math.sin(phi) * Math.sin(theta);
      const z = distance * Math.cos(phi);
      
      accentStarsVertices.push(x, y, z);
    }

    accentStarsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(accentStarsVertices, 3));
    const accentStars = new THREE.Points(accentStarsGeometry, accentStarsMaterial);
    this.scene.add(accentStars);
  }

  setupControls() {
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'dropdown-controls collapsed';
    document.body.appendChild(controlsContainer);
    
    controlsContainer.style.width = '100%';
    controlsContainer.style.maxWidth = '100vw';
    controlsContainer.style.boxSizing = 'border-box';
    
    const dropdownHeader = document.createElement('div');
    dropdownHeader.className = 'dropdown-header';
    controlsContainer.appendChild(dropdownHeader);
    
    const dropdownHeaderLeft = document.createElement('div');
    dropdownHeaderLeft.className = 'dropdown-header-left';
    dropdownHeader.appendChild(dropdownHeaderLeft);
    
    const headerIcon = document.createElement('div');
    headerIcon.className = 'header-icon';
    headerIcon.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="5" fill="white"/>
        <circle cx="12" cy="12" r="9" stroke="white" stroke-width="1.5" stroke-dasharray="1 3"/>
        <circle cx="12" cy="12" r="12" stroke="white" stroke-width="1" stroke-dasharray="1 4"/>
      </svg>
    `;
    dropdownHeaderLeft.appendChild(headerIcon);

    const title = document.createElement('div');
    title.className = 'dropdown-title';
    title.textContent = 'SOLAR SYSTEM CONTROLS';
    dropdownHeaderLeft.appendChild(title);
    
    const dropdownIcon = document.createElement('div');
    dropdownIcon.className = 'dropdown-icon';
    dropdownIcon.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7 14l5-5 5 5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    dropdownHeader.appendChild(dropdownIcon);
    
    const dropdownContent = document.createElement('div');
    dropdownContent.className = 'dropdown-content';
    controlsContainer.appendChild(dropdownContent);

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'dropdown-button-container';
    dropdownContent.appendChild(buttonContainer);
    
    dropdownHeader.addEventListener('click', (event) => {
      event.stopPropagation(); // Prevent event bubbling
      event.preventDefault(); // Prevent default behavior
      controlsContainer.classList.toggle('collapsed');
    });
    
    let touchStartY = 0;
    let touchEndY = 0;
    
    controlsContainer.addEventListener('touchstart', (e) => {
      touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });
    
    controlsContainer.addEventListener('touchend', (e) => {
      if (e.target.closest('.dropdown-header') || !controlsContainer.classList.contains('collapsed')) {
        touchEndY = e.changedTouches[0].screenY;
        handleSwipeGesture();
      }
    });
    
    function handleSwipeGesture() {
      if (touchStartY - touchEndY > 50) {
        controlsContainer.classList.remove('collapsed');
      } else if (touchEndY - touchStartY > 50) {
        controlsContainer.classList.add('collapsed');
      }
    }
    
    controlsContainer.addEventListener('pointerdown', (event) => {
      if (!event.target.closest('.dropdown-header')) {
        event.stopPropagation(); // Don't let clicks inside dropdown bubble to scene
      }
    });
    
    const pauseButton = document.createElement('button');
    pauseButton.className = 'control-button tooltip button-flex';
    pauseButton.setAttribute('data-tooltip', 'Toggle animation playback');
    pauseButton.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="6" y="4" width="4" height="16" rx="1" fill="white"/>
        <rect x="14" y="4" width="4" height="16" rx="1" fill="white"/>
      </svg>
      <span>PAUSE</span>
    `;
    
    buttonContainer.appendChild(pauseButton);
    
    pauseButton.addEventListener('click', () => {
      this.isPaused = !this.isPaused;
      
      if (this.isPaused) {
        pauseButton.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 5V19L19 12L8 5Z" fill="white"/>
          </svg>
          <span>RESUME</span>
        `;
      } else {
        pauseButton.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="6" y="4" width="4" height="16" rx="1" fill="white"/>
            <rect x="14" y="4" width="4" height="16" rx="1" fill="white"/>
          </svg>
          <span>PAUSE</span>
        `;
      }
    });
    
    const resetButton = document.createElement('button');
    resetButton.className = 'control-button tooltip button-flex';
    resetButton.setAttribute('data-tooltip', 'Reset all speeds to default');
    resetButton.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4C7.58 4 4.01 7.58 4.01 12C4.01 16.42 7.58 20 12 20C15.73 20 18.84 17.45 19.73 14H17.65C16.83 16.33 14.61 18 12 18C8.69 18 6 15.31 6 12C6 8.69 8.69 6 12 6C13.66 6 15.14 6.69 16.22 7.78L13 11H20V4L17.65 6.35Z" fill="white"/>
      </svg>
      <span>RESET</span>
    `;
    buttonContainer.appendChild(resetButton);
    
    resetButton.addEventListener('click', () => {
      mainSlider.value = '1';
      this.animationSpeed = 1;
      mainSpeedValue.textContent = '1.0×';
      
      this.planets.forEach((planet, index) => {
        const planetContainer = dropdownContent.querySelectorAll('.planet-control')[index];
        const planetSlider = planetContainer.querySelector('input[type="range"]');
        const speedValue = planetContainer.querySelector('.speed-value');
        
        planetSlider.value = '1';
        planet.speed = planet.originalSpeed;
        speedValue.textContent = '1.0×';
      });
      
      this.isPaused = false;
      pauseButton.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="6" y="4" width="4" height="16" rx="1" fill="white"/>
          <rect x="14" y="4" width="4" height="16" rx="1" fill="white"/>
        </svg>
        <span>PAUSE</span>
      `;
    });

    const mainSpeedSection = document.createElement('div');
    mainSpeedSection.className = 'dropdown-main-speed';
    dropdownContent.appendChild(mainSpeedSection);
    
    const mainSpeedLabel = document.createElement('div');
    mainSpeedLabel.className = 'dropdown-main-speed-label';
    mainSpeedSection.appendChild(mainSpeedLabel);
    
    const mainSpeedText = document.createElement('div');
    mainSpeedText.className = 'dropdown-main-speed-text';
    mainSpeedText.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.58 20 4 16.42 4 12C4 7.58 7.58 4 12 4C16.42 4 20 7.58 20 12C20 16.42 16.42 20 12 20Z" fill="#028ebd"/>
        <path d="M12.5 7H11V13L16.2 16.2L17 14.9L12.5 12.2V7Z" fill="#028ebd"/>
      </svg>
      <span>Global Speed</span>
    `;
    mainSpeedLabel.appendChild(mainSpeedText);
    
    const mainSpeedValue = document.createElement('span');
    mainSpeedValue.className = 'speed-value';
    mainSpeedValue.textContent = '1.0×';
    mainSpeedLabel.appendChild(mainSpeedValue);

    const mainSlider = document.createElement('input');
    mainSlider.type = 'range';
    mainSlider.min = '0';
    mainSlider.max = '10'; 
    mainSlider.step = '0.1';
    mainSlider.value = '1';
    mainSlider.className = 'control-slider';
    mainSpeedSection.appendChild(mainSlider);

    mainSlider.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      this.animationSpeed = value;
      mainSpeedValue.textContent = value.toFixed(1) + '×';
    });

    const separator = document.createElement('div');
    separator.className = 'dropdown-separator';
    dropdownContent.appendChild(separator);
    
    const line = document.createElement('hr');
    line.className = 'dropdown-separator-line';
    separator.appendChild(line);
    
    const planetsTitle = document.createElement('div');
    planetsTitle.className = 'dropdown-planets-title';
    planetsTitle.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle; margin-right: 5px;">
        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.58 20 4 16.42 4 12C4 7.58 7.58 4 12 4C16.42 4 20 7.58 20 12C20 16.42 16.42 20 12 20Z" fill="white"/>
        <circle cx="12" cy="12" r="3" fill="white"/>
        <path d="M6.5 12C6.5 8.96 8.96 6.5 12 6.5" stroke="white" stroke-width="1.5"/>
        <path d="M17.5 12C17.5 15.04 15.04 17.5 12 17.5" stroke="white" stroke-width="1.5"/>
      </svg>
      PLANET SPEEDS
    `;
    separator.appendChild(planetsTitle);

    const planetControlsContainer = document.createElement('div');
    planetControlsContainer.className = 'dropdown-planet-controls planet-controls';
    dropdownContent.appendChild(planetControlsContainer);

    this.planets.forEach(planet => {
      const planetContainer = document.createElement('div');
      planetContainer.className = 'planet-control';
      planetControlsContainer.appendChild(planetContainer);

      const planetLabelRow = document.createElement('div');
      planetLabelRow.className = 'planet-label-row';
      planetContainer.appendChild(planetLabelRow);

      const planetLabel = document.createElement('div');
      planetLabel.className = 'planet-label';
      planetLabel.textContent = planet.name;
      planetLabelRow.appendChild(planetLabel);

      const speedValue = document.createElement('div');
      speedValue.className = 'speed-value planet-speed-value';
      speedValue.textContent = '1.0×';
      planetLabelRow.appendChild(speedValue);

      const planetSlider = document.createElement('input');
      planetSlider.type = 'range';
      planetSlider.min = '0';
      planetSlider.max = '10';
      planetSlider.step = '0.1';
      planetSlider.value = '1';
      planetSlider.className = 'control-slider';
      planetContainer.appendChild(planetSlider);

      planet.originalSpeed = planet.speed;
      
      planetSlider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        planet.speed = planet.originalSpeed * value;
        speedValue.textContent = value.toFixed(1) + '×';
      });
    });
  }

  setupEventListeners() {
    // Create tooltip element
    const tooltip = document.createElement('div');
    tooltip.id = 'celestial-tooltip';
    tooltip.className = 'celestial-tooltip';
    document.body.appendChild(tooltip);
    this.tooltip = tooltip;
    
    // Cache the controls container reference
    this.controlsContainer = document.querySelector('.dropdown-controls');
    
    // Setup pulse animation
    setTimeout(() => {
      if (this.controlsContainer) {
        // Create pulse animation function
        const pulseDropdown = () => {
          if (window.innerWidth < 768) {
            const dropdownHeader = this.controlsContainer.querySelector('.dropdown-header');
            if (dropdownHeader) {
              dropdownHeader.classList.add('pulse-attention');
              setTimeout(() => dropdownHeader.classList.remove('pulse-attention'), 1000);
            }
          }
        };
        
        // Schedule the pulse animations
        setTimeout(pulseDropdown, 2000);
        const pulseInterval = setInterval(pulseDropdown, 5000);
        setTimeout(() => clearInterval(pulseInterval), 20000);
      }
    }, 1000);
    
    // Unified pointer event handler for both mouse and touch
    const handlePointerMove = (event) => {
      // Get coordinates from either mouse or touch event
      let clientX, clientY;
      if (event.touches && event.touches.length > 0) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
      } else {
        clientX = event.clientX;
        clientY = event.clientY;
      }
      
      // Skip raycasting if pointer is over expanded controls panel
      if (this.controlsContainer && 
          !this.controlsContainer.classList.contains('collapsed') && 
          clientY > window.innerHeight - this.controlsContainer.offsetHeight) {
        return;
      }
      
      // Update mouse position for raycaster
      this.mouse.x = (clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(clientY / window.innerHeight) * 2 + 1;
    };
    
    // Add single event listener for mouse move
    window.addEventListener('mousemove', handlePointerMove);
    // Add single event listener for touch move
    window.addEventListener('touchmove', handlePointerMove, { passive: true });
  }

  showTooltip(object, name, position) {
    if (!this.tooltip) return;
    
    let details = '';
    
    if (name === 'Sun') {
      details = 'Sun rotates faster at its equator than at its poles';
    } else if (name === 'Moon') {
      details = 'Moon is actually lemon-shaped, not round';
    } else if (name === 'Mercury') {
      details = 'Mercury has ice at its poles despite being the closest planet to the Sun';
    } else if (name === 'Venus') {
      details = 'A day on Venus is longer than its year';
    } else if (name === 'Earth') {
      details = "There are more stars in the universe than grains of sand on all Earth's beaches";
    } else if (name === 'Mars') {
      details = 'Mars is home to the tallest volcano in the solar system';
    } else if (name === 'Jupiter') {
      details = 'Jupiter has the shortest day of all planets';
    } else if (name === 'Saturn') {
      details = 'Saturn is the only planet less dense than water';
    } else if (name === 'Uranus') {
      details = 'Uranus is the coldest planet in the solar system';
    } else if (name === 'Neptune') {
      details = 'Neptune has the strongest winds in the solar system';
    }
    
    this.tooltip.innerHTML = `<div class="celestial-tooltip-name">${name}</div>${details ? '<div class="celestial-tooltip-details">' + details + '</div>' : ''}`;
    
    // For better positioning, we need to temporarily show the tooltip offscreen to get its dimensions
    this.tooltip.style.display = 'block';
    this.tooltip.style.opacity = '0';
    this.tooltip.style.left = '-9999px';
    this.tooltip.style.top = '-9999px';
    
    // Force browser to calculate dimensions
    const tooltipWidth = this.tooltip.offsetWidth || 280;
    const tooltipHeight = this.tooltip.offsetHeight || 80;
    
    // Calculate available space
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const isMobile = viewportWidth < 768;
    
    const controlsPanel = document.querySelector('.dropdown-controls');
    
    // Get available space and constraints
    const minY = this.controlsContainer ? 
      (this.controlsContainer.classList.contains('collapsed') 
        ? viewportHeight - 60  // Height of visible part when collapsed
        : this.controlsContainer.getBoundingClientRect().top) 
      : viewportHeight - 10;
    
    // Different positioning for mobile vs desktop
    if (isMobile) {
      // Mobile: center horizontally, place in upper part of screen
      position.x = viewportWidth / 2; // Center (transform will handle exact centering)
      
      // Calculate vertical position away from dropdown
      const topSpace = minY - 10;
      const idealY = Math.min(position.y, topSpace/2 - tooltipHeight/2);
      position.y = Math.max(70, idealY); // Keep below header area
    } else {
      // Desktop: keep tooltip near object but constrained to screen
      position.y = Math.min(position.y, minY - tooltipHeight - 10); // Below top, above dropdown
      position.x = Math.max(10, Math.min(position.x, viewportWidth - tooltipWidth - 10)); // Horizontal bounds
      position.y = Math.max(10, position.y); // Prevent going off top
    }
    
    // Set position based on device type
    
    if (!isMobile) {
      // On desktop, use the calculated position
      this.tooltip.style.left = `${position.x}px`;
      this.tooltip.style.top = `${position.y}px`;
      this.tooltip.style.transform = '';
    } else {
      // On mobile, center horizontally with transform and set top position
      this.tooltip.style.position = 'fixed';
      this.tooltip.style.left = '50%';
      this.tooltip.style.top = `${position.y}px`;
      this.tooltip.style.transform = 'translateX(-50%)';
    }
    
    // Show the tooltip
    this.tooltip.style.display = 'block';
    this.tooltip.style.opacity = '1';
    
    this.tooltip.classList.add('showing');
    setTimeout(() => {
      if (this.tooltip) {
        this.tooltip.classList.remove('showing');
      }
    }, 300);
    
    this.hoveredObject = object;
  }
  
  hideTooltip() {
    if (this.tooltip) {
      this.tooltip.style.display = 'none';
      this.tooltip.style.opacity = '0';
    }
    this.hoveredObject = null;
  }
  
  getScreenPosition(object) {
    const vector = new THREE.Vector3();
    object.getWorldPosition(vector);
    vector.project(this.camera);
    
    const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-(vector.y * 0.5) + 0.5) * window.innerHeight;
    
    const isMobile = window.innerWidth < 768;
    const verticalOffset = isMobile ? 10 : 30;
    
    return { x, y: y - verticalOffset };
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    
    // Update tooltip position if there's a hovered object
    if (this.hoveredObject && this.tooltip) {
      const screenPos = this.getScreenPosition(this.hoveredObject);
      const isMobile = this.isMobile;
      const viewportHeight = window.innerHeight;
      
      if (!isMobile) {
        // Desktop positioning
        this.tooltip.style.left = `${screenPos.x}px`;
        this.tooltip.style.top = `${screenPos.y}px`;
      } else {
        // Mobile positioning with vertical constraints
        let topPosition = screenPos.y;
        
        if (this.controlsContainer) {
          const minY = this.controlsContainer.classList.contains('collapsed') 
            ? viewportHeight - 60
            : this.controlsContainer.getBoundingClientRect().top;
          
          const tooltipHeight = this.tooltip.offsetHeight || 80;
          topPosition = Math.max(70, Math.min(topPosition, minY - tooltipHeight - 10));
        }
        
        this.tooltip.style.top = `${topPosition}px`;
      }
    }

    if (!this.isPaused) {
      this.planets.forEach(planet => {
        planet.angle += planet.speed * this.animationSpeed;
        planet.group.position.x = Math.cos(planet.angle) * planet.distance;
        planet.group.position.z = Math.sin(planet.angle) * planet.distance;
        
        planet.mesh.rotation.y += 0.01 * this.animationSpeed;
        
        if (planet.name === 'Earth' && planet.group.userData.moon) {
          const moonAngle = Date.now() * 0.001 * this.animationSpeed;
          const moonDistance = planet.mesh.geometry.parameters.radius * 3;
          planet.group.userData.moon.position.x = Math.cos(moonAngle) * moonDistance;
          planet.group.userData.moon.position.z = Math.sin(moonAngle) * moonDistance;
          planet.group.userData.moon.rotation.y += 0.02 * this.animationSpeed;
        }
      });
      
      this.sun.rotation.y += 0.002 * this.animationSpeed;
      
      const time = Date.now() * 0.001;
      const pulse = 1 + Math.sin(time * 0.5) * 0.05;
      this.sun.scale.setScalar(pulse);
    }

    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    const objectsToTest = [];
    
    this.planets.forEach(planet => {
      objectsToTest.push(planet.mesh);
      
      if (planet.name === 'Earth' && planet.group.userData.moon) {
        objectsToTest.push(planet.group.userData.moon);
      }
    });
    
    objectsToTest.push(this.sun);
    
    const intersects = this.raycaster.intersectObjects(objectsToTest);
    
    if (intersects.length > 0) {
      const intersectedObject = intersects[0].object;
      
      // Check if pointer is over dropdown area
      const isOverDropdown = this.controlsContainer && 
        !this.controlsContainer.classList.contains('collapsed') && 
        this.mouse.y > -0.8; 
      
      // Only show tooltips when not hovering dropdown and object changed
      if (!isOverDropdown && this.hoveredObject !== intersectedObject) {
        this.hideTooltip();
        
        // Determine object name
        let objectName = null;
        
        if (intersectedObject === this.sun) {
          objectName = 'Sun';
        } else if (intersectedObject.userData?.isMoon) {
          objectName = 'Moon';
        } else {
          const planet = this.planets.find(p => p.mesh === intersectedObject);
          if (planet) objectName = planet.name;
        }
        
        // Show tooltip if we have a valid name
        if (objectName) {
          const screenPos = this.getScreenPosition(intersectedObject);
          this.showTooltip(intersectedObject, objectName, screenPos);
        }
      }
    } else if (this.hoveredObject) {
      this.hideTooltip();
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}

new SolarSystem();
