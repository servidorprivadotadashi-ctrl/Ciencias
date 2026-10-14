// Importar funciones modulares de Firebase SDK v10
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Configuración oficial de tu proyecto EcoApp-Escolar
const firebaseConfig = {
  apiKey: "AIzaSyD3QbyjhPBLbrb7_VOx1K5WitXb5PgC3do",
  authDomain: "ecoapp-escolar.firebaseapp.com",
  projectId: "ecoapp-escolar",
  storageBucket: "ecoapp-escolar.firebasestorage.app",
  messagingSenderId: "783436822034",
  appId: "1:783436822034:web:f8100d789a952a1e29cacb",
  measurementId: "G-PP5G321MEW"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Respuestas correctas del cuestionario
const correctAnswers = {
  q1: "B", q2: "A", q3: "B", q4: "B", q5: "B",
  q6: "B", q7: "A", q8: "B", q9: "A", q10: "B"
};

document.addEventListener("DOMContentLoaded", () => {
  verificarSesion();

  // Handler Formulario Login
  const loginForm = document.getElementById("login-form");
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const nombres = document.getElementById("student-name").value.trim();
    const apPaterno = document.getElementById("student-ap-paterno").value.trim();
    const apMaterno = document.getElementById("student-ap-materno").value.trim();
    const grupo = document.getElementById("student-group").value.trim();
    const fecha = document.getElementById("student-date").value;

    const nombreCompleto = `${nombres} ${apPaterno} ${apMaterno}`;

    const user = { nombres, apPaterno, apMaterno, nombreCompleto, grupo, fecha };
    localStorage.setItem("ecoUser", JSON.stringify(user));
    
    iniciarApp(user);
  });

  // Handler Formulario Cuestionario
  const quizForm = document.getElementById("quiz-form");
  quizForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const btnSubmit = document.getElementById("btn-submit");
    btnSubmit.disabled = true;
    btnSubmit.innerText = "Guardando en la nube...";

    const user = JSON.parse(localStorage.getItem("ecoUser"));
    
    const respuestasAlumno = {};
    let aciertos = 0;

    for (let i = 1; i <= 10; i++) {
      const qKey = `q${i}`;
      const selectedOption = document.querySelector(`input[name="${qKey}"]:checked`);
      const val = selectedOption ? selectedOption.value : "";
      respuestasAlumno[qKey] = val;

      if (val === correctAnswers[qKey]) {
        aciertos++;
      }
    }

    const calificacion = aciertos * 10;

    const resultadoFinal = {
      estudiante: user.nombreCompleto,
      nombres: user.nombres,
      apellidoPaterno: user.apPaterno,
      apellidoMaterno: user.apMaterno,
      grupo: user.grupo,
      fechaLogin: user.fecha,
      fechaEnvio: new Date().toISOString(),
      respuestas: respuestasAlumno,
      aciertos: aciertos,
      calificacion: calificacion
    };

    try {
      const docRef = await addDoc(collection(db, "respuestas_cuestionario"), resultadoFinal);
      console.log("Registro guardado exitosamente en Cloud Firestore. ID:", docRef.id);

      localStorage.setItem("ecoQuizDone", JSON.stringify(resultadoFinal));
      mostrarQuizCompletado(resultadoFinal);
    } catch (error) {
      console.error("Error al escribir en Firestore:", error);
      alert("Hubo un error al guardar las respuestas. Por favor revisa tu conexión.");
      btnSubmit.disabled = false;
      btnSubmit.innerText = "Enviar Cuestionario";
    }
  });
});

function verificarSesion() {
  const savedUser = localStorage.getItem("ecoUser");
  if (savedUser) {
    const user = JSON.parse(savedUser);
    iniciarApp(user);
  }
}

function iniciarApp(user) {
  document.getElementById("login-screen").classList.remove("active");
  document.getElementById("main-app").classList.add("active");
  document.getElementById("user-badge").innerText = `${user.nombreCompleto} (${user.grupo})`;

  const quizDone = localStorage.getItem("ecoQuizDone");
  if (quizDone) {
    const data = JSON.parse(quizDone);
    mostrarQuizCompletado(data);
  }
}

function mostrarQuizCompletado(data) {
  document.getElementById("quiz-container").classList.add("hidden");
  const quizCompleted = document.getElementById("quiz-completed");
  quizCompleted.classList.remove("hidden");

  document.getElementById("score-text").innerText = 
    `Obtuviste ${data.aciertos} de 10 aciertos (Calificación: ${data.calificacion}/100).`;
}

// Control global de Secciones
window.mostrarSeccion = function(seccion) {
  document.querySelectorAll(".tab-content").forEach(tab => tab.classList.remove("active"));
  document.querySelectorAll(".nav-btn").forEach(btn => btn.classList.remove("active"));

  if (seccion === "informe") {
    document.getElementById("tab-informe").classList.add("active");
    document.getElementById("nav-informe").classList.add("active");
  } else if (seccion === "calc") {
    document.getElementById("tab-calc").classList.add("active");
    document.getElementById("nav-calc").classList.add("active");
  } else if (seccion === "quiz") {
    document.getElementById("tab-quiz").classList.add("active");
    document.getElementById("nav-quiz").classList.add("active");
  }
};

// Acordeón interactivo para secciones del informe
window.toggleAccordion = function(panelId) {
  const panel = document.getElementById(panelId);
  if (panel.style.display === "block") {
    panel.style.display = "none";
  } else {
    panel.style.display = "block";
  }
};

// Calculadora de Impacto Ambiental
window.calcularImpacto = function() {
  const pet = parseFloat(document.getElementById("calc-pet").value) || 0;
  const latas = parseFloat(document.getElementById("calc-latas").value) || 0;

  const co2Anual = ((pet * 0.04) + (latas * 0.09)) * 52;
  const kwhAnual = ((pet * 0.1) + (latas * 0.35)) * 52;
  const horasFoco = (kwhAnual / 0.01);

  document.getElementById("res-co2").innerText = co2Anual.toFixed(2);
  document.getElementById("res-kwh").innerText = kwhAnual.toFixed(2);
  document.getElementById("res-foco").innerText = Math.round(horasFoco);

  document.getElementById("calc-results").classList.remove("hidden");
};

// Modal informativo / Créditos
window.abrirModalInfo = function() {
  alert("EcoApp Pro © 2026\n\nDesarrollado e Investigado por:\n- Mauricio Montalvo Carranza y Asociados\n- Cerezo Hernández Miguel Iván\n- Paola Rojas Gonzáles\n- Diego Fuentes Gálvez\n\nTodos los derechos reservados.");
};
// Función para cerrar sesión y cambiar de alumno
window.cerrarSesion = function() {
  if (confirm("¿Deseas cerrar sesión para que otro alumno ingrese sus datos?")) {
    localStorage.removeItem("ecoUser");
    localStorage.removeItem("ecoQuizDone");
    location.reload();
  }
};