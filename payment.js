import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyBJgUWYAB0XLRuecLGs_urw38Rx8E-uD98",
  authDomain: "iboostup-orders.firebaseapp.com",
  projectId: "iboostup-orders",
  storageBucket: "iboostup-orders.firebasestorage.app",
  messagingSenderId: "942346831712",
  appId: "1:942346831712:web:43dacb7c568c9f25264005"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

let payments = [];

// 📥 LOAD DATA
async function loadPayments() {
  const snapshot = await getDocs(collection(db, "payments"));

  payments = [];

  snapshot.forEach(docSnap => {
    payments.push({
      firebaseId: docSnap.id,
      ...docSnap.data()
    });
  });

  display(payments);
}

// 📊 DISPLAY TABLE
function display(data) {
  const table = document.getElementById("paymentTable");
  const summary = document.getElementById("summary");

  table.innerHTML = "";

  let total = 0;
  let received = 0;
  let remaining = 0;

  data.forEach(p => {

    total += Number(p.totalAmount || 0);
    received += Number(p.received || 0);
    remaining += Number(p.remaining || 0);

    table.innerHTML += `
      <tr>
        <td>${p.date || "-"}</td>

        <td>${p.name || "-"}</td>  <!-- ✅ CUSTOMER NAME -->
        <td>₹${p.totalAmount || 0}</td>
        <td>₹${p.received || 0}</td>
        <td>₹${p.remaining || 0}</td>
      </tr>
    `;
  });

  summary.innerHTML = `
    <h3>Total: ₹${total}</h3>
    <h3>Received: ₹${received}</h3>
    <h3>Remaining: ₹${remaining}</h3>
  `;
}

// 📤 UPLOAD BILL
window.uploadBill = async function (paymentId, input) {

  const file = input.files[0];
  if (!file) return;

  const storageRef = ref(storage, "bills/" + Date.now() + "_" + file.name);

  await uploadBytes(storageRef, file);

  const url = await getDownloadURL(storageRef);

  await updateDoc(doc(db, "payments", paymentId), {
    fileURL: url
  });

  alert("Bill uploaded ✅");

  loadPayments();
};

// 🔍 SEARCH
document.addEventListener("DOMContentLoaded", () => {
  loadPayments();
});

document.getElementById("searchCustomer").addEventListener("input", function () {

  let value = this.value.trim().toLowerCase();

  let filtered = payments.filter(p => {
    let name = p.name ? p.name.toLowerCase() : "";
    return name.includes(value);
  });

  display(filtered);
});
console.log(payments);