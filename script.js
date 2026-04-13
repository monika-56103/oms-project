import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    deleteDoc, 
    doc, 
    updateDoc 
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

// 🔥 YOUR REAL CONFIG (DONE ✅)
const firebaseConfig = {
  apiKey: "AIzaSyBJgUWYAB0XLRuecLGs_urw38Rx8E-uD98",
  authDomain: "iboostup-orders.firebaseapp.com",
  projectId: "iboostup-orders",
  storageBucket: "iboostup-orders.firebasestorage.app",
  messagingSenderId: "942346831712",
  appId: "1:942346831712:web:43dacb7c568c9f25264005"
};

// 🚀 INIT
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let orders = [];

// 📥 LOAD FROM FIREBASE
async function loadOrders() {
    const querySnapshot = await getDocs(collection(db, "orders"));
    orders = [];

    querySnapshot.forEach((docSnap) => {
        let data = docSnap.data();

        orders.push({
            firebaseId: docSnap.id,
            id: data.id,
            name: data.name,
            phone: data.phone,
            product: data.product,
            price: Number(data.price),
            status: data.status || "Upcoming",
            description: data.description || data.product,
            trackingId: data.trackingId || ""
        });
    });

    displayOrders(orders);
    updateDashboard();
}

// 📊 DISPLAY TABLE
function displayOrders(data) {
    let table = document.getElementById("orderTable");
    let extraHeader = document.getElementById("extraHeader");

    table.innerHTML = "";

    let showDescription = data.some(o => o.status === "Confirmed" || o.status === "Dispatch");
    let showTracking = data.some(o => o.status === "In Transit");

    extraHeader.innerText = showDescription 
        ? "Item Description" 
        : showTracking 
        ? "Tracking ID" 
        : "";

    data.forEach(order => {

        let extraColumn = "-";

        if (order.status === "Confirmed" || order.status === "Dispatch") {
            extraColumn = order.description;
        } 
        else if (order.status === "In Transit") {
            extraColumn = `
            <input type="text" value="${order.trackingId}" 
            onchange="updateTracking('${order.firebaseId}', this.value)">
            `;
        }

        table.innerHTML += `
        <tr>
            <td>${order.id}</td>
            <td>${order.name}</td>
            <td class="status ${order.status.replace(" ", "")}">
                ${order.status}
            </td>
            <td>${extraColumn}</td>
            <td>
                <button class="view-btn" onclick="viewDetails(${order.id})">View</button>
                <button class="confirm-btn" onclick="updateStatus('${order.firebaseId}', 'Confirmed')">Confirm</button>
                <button class="dispatch-btn" onclick="updateStatus('${order.firebaseId}', 'Ready To Dispatch')">Dispatch</button>
                <button class="ship-btn" onclick="updateStatus('${order.firebaseId}', 'In Transit')">Ship</button>
                <button class="deliver-btn" onclick="updateStatus('${order.firebaseId}', 'Delivered')">Deliver</button>
                <button class="delete-btn" onclick="deleteOrder('${order.firebaseId}')">Delete</button>
            </td>
        </tr>`;
    });
}

// ➕ ADD ORDER
window.addOrder = async function () {

    let billNo = document.getElementById("billNo").value;

    if (!billNo) {
        alert("Enter Bill No");
        return;
    }

    let name = document.getElementById("name").value;
    let phone = document.getElementById("phone").value;
    let product = document.getElementById("product").value;
    let price = Number(document.getElementById("price").value);

    // ✅ ORDER SAVE
    await addDoc(collection(db, "orders"), {
        id: billNo,
        name: name,
        phone: phone,
        product: product,
        price: price,
        status: "Upcoming",
        description: product,
        trackingId: "",
        date: new Date().toLocaleDateString()
    });

    // 🔥 👉 YAHI ADD KARNA THA (ORDER KE BAAD)
    await addDoc(collection(db, "payments"), {
        name: name,
        billNo: billNo,
        totalAmount: price,
        received: 0,
        remaining: price,
        date: new Date().toLocaleDateString()
    });

    // 🔄 reload
    loadOrders();

    // 🧹 clear fields
    document.getElementById("billNo").value = "";
    document.getElementById("name").value = "";
    document.getElementById("phone").value = "";
    document.getElementById("product").value = "";
    document.getElementById("price").value = "";
};

// 🔄 UPDATE STATUS
window.updateStatus = async function (firebaseId, status) {
    await updateDoc(doc(db, "orders", firebaseId), {
        status: status
    });
    loadOrders();
};

// 🚚 TRACKING
window.updateTracking = async function (firebaseId, value) {
    await updateDoc(doc(db, "orders", firebaseId), {
        trackingId: value
    });
};

// ❌ DELETE
window.deleteOrder = async function (firebaseId) {
    await deleteDoc(doc(db, "orders", firebaseId));
    loadOrders();
};

// 👁 VIEW
window.viewDetails = function(id) {
    let order = orders.find(o => o.id === id);

    document.getElementById("popup").style.display = "block";

    document.getElementById("popupData").innerHTML = `
        <p><b>Name:</b> ${order.name}</p>
        <p><b>Phone:</b> ${order.phone}</p>
        <p><b>Product:</b> ${order.product}</p>
        <p><b>Price:</b> ₹${order.price}</p>
    `;
};

window.closePopup = function () {
    document.getElementById("popup").style.display = "none";
};

// 📊 DASHBOARD
function updateDashboard() {
    document.getElementById("totalOrders").innerText = orders.length;

    let pending = orders.filter(o => o.status !== "Delivered").length;
    document.getElementById("pendingOrders").innerText = pending;

    let delivered = orders.filter(o => o.status === "Delivered").length;
    document.getElementById("deliveredOrders").innerText = delivered;

    let revenue = orders
        .filter(o => o.status === "Delivered")
        .reduce((sum, o) => sum + o.price, 0);

    document.getElementById("revenue").innerText = revenue;
}

// 🚀 START
loadOrders();
// 🔍 SEARCH + 🎯 FILTER FIX
window.addEventListener("DOMContentLoaded", () => {

    // 🔍 SEARCH BY ID
    document.getElementById("search").addEventListener("input", function() {
        let value = this.value;
        let filtered = orders.filter(o => 
            o.id.toString().includes(value)
        );
        displayOrders(filtered);
    });

    // 🎯 FILTER BY STATUS
    document.getElementById("statusFilter").addEventListener("change", function() {
        let value = this.value;

        let filtered = value 
            ? orders.filter(o => o.status === value) 
            : orders;

        displayOrders(filtered);
    });

});
document.addEventListener("DOMContentLoaded", () => {

    // 🔍 SEARCH
    document.getElementById("search").addEventListener("input", function() {
        let value = this.value.toLowerCase();

        let filtered = orders.filter(o => 
            o.id.toString().includes(value) ||
            o.name.toLowerCase().includes(value)
        );

        displayOrders(filtered);
    });

    // 🎯 FILTER
    document.getElementById("statusFilter").addEventListener("change", function() {
        let value = this.value;

        let filtered = value 
            ? orders.filter(o => o.status === value) 
            : orders;

        displayOrders(filtered);
    });

});
window.logout = function () {
    localStorage.removeItem("isLoggedIn");
    window.location.href = "login.html";
};
document.addEventListener("DOMContentLoaded", () => {
    let btn = document.getElementById("logoutBtn");

    if (btn) {
        btn.addEventListener("click", () => {
            localStorage.removeItem("isLoggedIn");
            window.location.href = "login.html"; // ✅ FIX
        });
    }
});