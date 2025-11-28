// Referencias DOM
const openCameraBtn = document.getElementById("openCamera");
const cameraContainer = document.getElementById("cameraContainer");
const video = document.getElementById("video");
const takePhotoBtn = document.getElementById("takePhoto");
const switchCameraBtn = document.getElementById("switchCamera");
const photoContainer = document.getElementById("photoContainer");
const photoResult = document.getElementById("photoResult");
const savePhotoBtn = document.getElementById("savePhoto");
const retakePhotoBtn = document.getElementById("retakePhoto");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const photoGallery = document.getElementById("photoGallery");
const photoCount = document.getElementById("photoCount");
const clearGalleryBtn = document.getElementById("clearGallery");
const cameraIndicator = document.getElementById("cameraIndicator");

let stream = null;
let currentFacingMode = "environment";
let currentImageDataURL = null;
let photos = [];

// Cargar fotos guardadas al iniciar
loadPhotosFromStorage();

// Abrir cámara
async function openCamera() {
  try {
    const constraints = {
      video: {
        facingMode: { ideal: currentFacingMode },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
    };

    if (stream) closeCamera();

    stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;

    await new Promise((resolve) => {
      video.onloadedmetadata = () => {
        video.play();
        resolve();
      };
    });

    if (currentFacingMode === "user") {
      video.style.transform = "scaleX(-1)";
    } else {
      video.style.transform = "scaleX(1)";
    }

    cameraContainer.style.display = "block";
    openCameraBtn.textContent = "Cámara Activa";
    openCameraBtn.disabled = true;

    // Actualizar indicador de cámara
    updateCameraIndicator();

    console.log("✅ Cámara abierta");
  } catch (error) {
    console.error("❌ Error:", error);
    alert("No se pudo acceder a la cámara. Verifica los permisos.");
  }
}

// Cambiar cámara
async function switchCamera() {
  currentFacingMode =
    currentFacingMode === "environment" ? "user" : "environment";
  if (stream) closeCamera();
  await openCamera();
}

// Actualizar indicador de cámara
function updateCameraIndicator() {
  if (currentFacingMode === "environment") {
    cameraIndicator.textContent = "📷 Cámara Trasera";
    cameraIndicator.style.background =
      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
  } else {
    cameraIndicator.textContent = "🤳 Cámara Frontal";
    cameraIndicator.style.background =
      "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)";
  }
}

// Tomar foto
function takePhoto() {
  if (!stream) {
    alert("Primero abre la cámara");
    return;
  }

  const videoWidth = video.videoWidth;
  const videoHeight = video.videoHeight;

  canvas.width = videoWidth;
  canvas.height = videoHeight;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (currentFacingMode === "user") {
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -videoWidth, 0, videoWidth, videoHeight);
    ctx.restore();
  } else {
    ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
  }

  currentImageDataURL = canvas.toDataURL("image/jpeg", 0.95);
  showPhoto(currentImageDataURL);

  console.log(`✅ Foto capturada: ${videoWidth}x${videoHeight}`);
}

// Mostrar foto
function showPhoto(imageDataURL) {
  photoResult.src = imageDataURL;
  photoResult.onload = () => console.log("✅ Foto mostrada");
  photoContainer.style.display = "block";
  cameraContainer.style.display = "none";
  openCameraBtn.textContent = "Abrir Cámara";
  openCameraBtn.disabled = false;
}

// Guardar foto
function savePhoto() {
  if (!currentImageDataURL) {
    alert("No hay foto para guardar");
    return;
  }

  // Guardar en galería
  const timestamp = Date.now();
  const cameraType =
    currentFacingMode === "environment" ? "Trasera" : "Frontal";
  const photoData = {
    id: timestamp,
    data: currentImageDataURL,
    date: new Date().toLocaleString("es-MX"),
    camera: cameraType,
  };

  photos.push(photoData);
  savePhotosToStorage();
  addPhotoToGallery(photoData);

  // Descargar archivo
  const link = document.createElement("a");
  link.download = `foto-${cameraType}-${timestamp}.jpg`;
  link.href = currentImageDataURL;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  alert("✅ Foto guardada en galería y descargada");
  console.log("✅ Guardada:", link.download);

  // Volver a la cámara
  retakePhoto();
}

// Agregar foto a la galería
function addPhotoToGallery(photoData) {
  const photoItem = document.createElement("div");
  photoItem.className = "photo-item";
  photoItem.dataset.id = photoData.id;

  const img = document.createElement("img");
  img.src = photoData.data;
  img.alt = `Foto ${photoData.date}`;

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "delete-photo-btn";
  deleteBtn.innerHTML = "🗑️";
  deleteBtn.onclick = () => deletePhoto(photoData.id);

  const cameraIcon = document.createElement("span");
  cameraIcon.className = "camera-icon";
  cameraIcon.textContent = photoData.camera === "Trasera" ? "📷" : "🤳";

  const date = document.createElement("span");
  date.className = "photo-date";
  date.textContent = photoData.date;

  photoItem.appendChild(img);
  photoItem.appendChild(deleteBtn);
  photoItem.appendChild(cameraIcon);
  photoItem.appendChild(date);

  // Agregar al inicio (más reciente primero)
  photoGallery.insertBefore(photoItem, photoGallery.firstChild);

  updatePhotoCount();
}

// Eliminar foto
function deletePhoto(id) {
  if (!confirm("¿Eliminar esta foto?")) return;

  photos = photos.filter((p) => p.id !== id);
  savePhotosToStorage();

  const photoItem = photoGallery.querySelector(`[data-id="${id}"]`);
  if (photoItem) {
    photoItem.remove();
  }

  updatePhotoCount();
  console.log("✅ Foto eliminada");
}

// Borrar todas las fotos
function clearGallery() {
  if (!confirm("¿Eliminar TODAS las fotos?")) return;

  photos = [];
  savePhotosToStorage();
  photoGallery.innerHTML = "";
  updatePhotoCount();

  alert("✅ Galería limpiada");
}

// Actualizar contador
function updatePhotoCount() {
  photoCount.textContent = photos.length;
  clearGalleryBtn.style.display = photos.length > 0 ? "block" : "none";
}

// Guardar en LocalStorage
function savePhotosToStorage() {
  try {
    localStorage.setItem("carrucel-photos", JSON.stringify(photos));
  } catch (error) {
    console.error("❌ Error guardando fotos:", error);
    alert("Error: Demasiadas fotos guardadas. Borra algunas.");
  }
}

// Cargar desde LocalStorage
function loadPhotosFromStorage() {
  try {
    const stored = localStorage.getItem("carrucel-photos");
    if (stored) {
      photos = JSON.parse(stored);
      photos.forEach((photo) => addPhotoToGallery(photo));
      console.log(`✅ ${photos.length} fotos cargadas`);
    }
  } catch (error) {
    console.error("❌ Error cargando fotos:", error);
  }
}

// Tomar otra foto
function retakePhoto() {
  photoContainer.style.display = "none";
  currentImageDataURL = null;
  openCamera();
}

// Cerrar cámara
function closeCamera() {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    stream = null;
    video.srcObject = null;
    cameraContainer.style.display = "none";
    openCameraBtn.textContent = "Abrir Cámara";
    openCameraBtn.disabled = false;
    console.log("✅ Cámara cerrada");
  }
}

// Event Listeners
openCameraBtn.addEventListener("click", openCamera);
takePhotoBtn.addEventListener("click", takePhoto);
switchCameraBtn.addEventListener("click", switchCamera);
savePhotoBtn.addEventListener("click", savePhoto);
retakePhotoBtn.addEventListener("click", retakePhoto);
clearGalleryBtn.addEventListener("click", clearGallery);

window.addEventListener("beforeunload", closeCamera);

// Detectar cámaras disponibles
async function checkCameras() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter((d) => d.kind === "videoinput");

    if (videoDevices.length <= 1) {
      switchCameraBtn.style.display = "none";
    }

    console.log(`✅ ${videoDevices.length} cámara(s) detectada(s)`);
  } catch (error) {
    console.log("⚠️ No se pudieron enumerar dispositivos:", error);
  }
}

checkCameras();
