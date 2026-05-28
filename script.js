```javascript
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



/* FIREBASE */

const firebaseConfig = {

  apiKey: "AIzaSyBCizR30KTtGXwlelD4Qxdu9IHJdPm-IlU",

  authDomain: "timzy-fashion-os.firebaseapp.com",

  projectId: "timzy-fashion-os",

  storageBucket: "timzy-fashion-os.firebasestorage.app",

  messagingSenderId: "515655826693",

  appId: "1:515655826693:web:4085b86651f39ffa03cb6c"

};



const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);



/* APIS */

const SALES_API =
  "https://sheetdb.io/api/v1/75j0rpy9j199t?sheet=Sales%20Responses";

const INVENTORY_API =
  "https://sheetdb.io/api/v1/75j0rpy9j199t?sheet=Inventory%20Restock";

const EXPENSES_API =
  "https://sheetdb.io/api/v1/75j0rpy9j199t?sheet=Expense%20Responses";



/* DATA */

let sales = [];

let inventory = [];

let expenses = [];

let orders = [];

let customers = [];



/* USER */

let currentRole = "customer";

let currentUserEmail = "";



/* HELPERS */

const money =
  n => "₦" + Number(n || 0).toLocaleString();



function cleanNumber(value) {

  return Number(
    String(value || "0")
      .replace(/[₦,\s]/g, "")
  ) || 0;

}



function normalize(row) {

  const obj = {};

  Object.keys(row).forEach(key => {

    obj[key.trim().toLowerCase()] =
      row[key];

  });

  return obj;

}



/* AUTH */

window.loginUser = async function () {

  const email =
    document.getElementById("loginEmail").value;

  const password =
    document.getElementById("loginPassword").value;

  try {

    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

  } catch (error) {

    alert(error.message);

  }

};



window.logoutUser = async function () {

  await signOut(auth);

};



/* MEASUREMENTS */

window.submitMeasurement = async function () {

  try {

    let targetEmail;

    // CUSTOMER
    if (currentRole === "customer") {

      targetEmail = currentUserEmail;

    } else {

      // STAFF + ADMIN
      targetEmail =
        document.getElementById(
          "targetCustomerEmail"
        ).value.toLowerCase();

    }

    await addDoc(
      collection(db, "customerMeasurements"),
      {

        email: targetEmail,

        uploadedBy: currentUserEmail,

        name:
          document.getElementById("cmName").value,

        phone:
          document.getElementById("cmPhone").value,

        shoulder:
          document.getElementById("cmShoulder").value,

        chest:
          document.getElementById("cmChest").value,

        waist:
          document.getElementById("cmWaist").value,

        hip:
          document.getElementById("cmHip").value,

        sleeve:
          document.getElementById("cmSleeve").value,

        length:
          document.getElementById("cmLength").value,

        notes:
          document.getElementById("cmNotes").value,

        createdAt: new Date()

      }
    );

    alert("Measurement saved successfully");

    await loadFirestoreData();

  } catch (error) {

    console.error(error);

    alert("Could not save measurement");

  }

};



/* ORDERS */

window.submitOrder = async function () {

  try {

    let targetEmail;

    // CUSTOMER
    if (currentRole === "customer") {

      targetEmail = currentUserEmail;

    } else {

      // STAFF + ADMIN
      targetEmail =
        document.getElementById(
          "targetCustomerEmail"
        ).value.toLowerCase();

    }

    const amount =
      cleanNumber(
        document.getElementById("coAmount").value
      );

    const deposit =
      cleanNumber(
        document.getElementById("coDeposit").value
      );

    await addDoc(
      collection(db, "customerOrders"),
      {

        email: targetEmail,

        uploadedBy: currentUserEmail,

        customer:
          document.getElementById("coName").value,

        phone:
          document.getElementById("coPhone").value,

        product:
          document.getElementById("coStyle").value,

        status: "Pending",

        delivery:
          document.getElementById("coDelivery").value,

        amount,

        deposit,

        balance:
          amount - deposit,

        createdAt: new Date()

      }
    );

    alert("Order submitted successfully");

    await loadFirestoreData();

  } catch (error) {

    console.error(error);

    alert("Could not submit order");

  }

};



/* SESSION */

onAuthStateChanged(auth, user => {

  const loginPage =
    document.getElementById("loginPage");

  const appView =
    document.getElementById("app");

  if (!loginPage || !appView) return;

  if (user) {

    loginPage.style.display = "none";

    appView.style.display = "block";

    currentUserEmail =
      user.email.toLowerCase();

    setupRoleAccess(currentUserEmail);

    loadAllData();

  } else {

    loginPage.style.display = "flex";

    appView.style.display = "none";

  }

});



/* ROLES */

function setupRoleAccess(email) {

  hideAllSections();

  // ADMIN
  if (email === "admin@timzyfashion.com") {

    currentRole = "admin";

    showRoleSections([
      "dashboard",
      "sales",
      "expenses",
      "inventory",
      "orders",
      "customers",
      "staff",
      "forms"
    ]);

    showTab("dashboard");

    return;

  }

  // STAFF
  if (email.includes("staff")) {

    currentRole = "staff";

    showRoleSections([
      "sales",
      "orders",
      "customers",
      "forms"
    ]);

    showTab("sales");

    return;

  }

  // CUSTOMER
  currentRole = "customer";

  showRoleSections([
    "customers"
  ]);

  showTab("customers");

}



/* UI */

function hideAllSections() {

  document.querySelectorAll(".tab")
    .forEach(tab => {

      tab.style.display = "none";

      tab.classList.remove("active");

    });

  document.querySelectorAll("nav button")
    .forEach(btn => {

      btn.style.display = "none";

    });

}



function showRoleSections(sectionIds) {

  sectionIds.forEach(id => {

    const section =
      document.getElementById(id);

    const button =
      document.querySelector(
        `button[onclick="showTab('${id}')"]`
      );

    if (section)
      section.style.display = "";

    if (button)
      button.style.display = "inline-block";

  });

}



window.showTab = function (id) {

  document.querySelectorAll(".tab")
    .forEach(tab => {

      tab.classList.remove("active");

    });

  const selectedTab =
    document.getElementById(id);

  if (selectedTab) {

    selectedTab.classList.add("active");

  }

};



/* API */

async function fetchSheet(api) {

  const response =
    await fetch(api);

  return await response.json();

}



/* FIRESTORE */

async function loadFirestoreData() {

  try {

    let measurementQuery;

    let ordersQuery;

    // CUSTOMER ONLY
    if (currentRole === "customer") {

      measurementQuery = query(
        collection(db, "customerMeasurements"),
        where(
          "email",
          "==",
          currentUserEmail
        )
      );

      ordersQuery = query(
        collection(db, "customerOrders"),
        where(
          "email",
          "==",
          currentUserEmail
        )
      );

    } else {

      // STAFF + ADMIN
      measurementQuery =
        collection(db, "customerMeasurements");

      ordersQuery =
        collection(db, "customerOrders");

    }

    const measurementSnapshot =
      await getDocs(measurementQuery);

    customers =
      measurementSnapshot.docs.map(
        doc => doc.data()
      );



    const ordersSnapshot =
      await getDocs(ordersQuery);

    orders =
      ordersSnapshot.docs.map(
        doc => doc.data()
      );



    render();

  } catch (error) {

    console.error(error);

  }

}



/* LOAD */

async function loadAllData() {

  try {

    const [
      salesData,
      inventoryData,
      expensesData
    ] = await Promise.all([
      fetchSheet(SALES_API),
      fetchSheet(INVENTORY_API),
      fetchSheet(EXPENSES_API)
    ]);



    /* SALES */

    sales = salesData.map(row => {

      const n = normalize(row);

      const qty =
        cleanNumber(
          n["quantity sold"] ||
          n["qty sold"] ||
          n["quantity"]
        );

      const unitPrice =
        cleanNumber(
          n["unit selling price"] ||
          n["selling price"] ||
          n["total sales"] ||
          n["total sales ₦"]
        );

      return {

        staff:
          n["staff name"] || "-",

        category:
          n["category"] || "-",

        product:
          n["product/vsku"] ||
          n["product/sku"] ||
          "-",

        qty,

        amount:
          qty * unitPrice

      };

    });



    /* INVENTORY */

    inventory = inventoryData.map(row => {

      const n = normalize(row);

      return {

        category:
          n["category"] || "-",

        product:
          n["product name"] || "-",

        sku:
          n["sku"] || "-",

        supplier:
          n["supplier/vendor"] || "-",

        quantity:
          cleanNumber(
            n["quantity added"]
          ),

        cost:
          cleanNumber(
            n["cost price"]
          ),

        selling:
          cleanNumber(
            n["selling price"]
          )

      };

    });



    /* EXPENSES */

    expenses = expensesData.map(row => {

      const n = normalize(row);

      const qty =
        cleanNumber(
          n["quantity"] ||
          1
        );

      const unitCost =
        cleanNumber(
          n["unit cost"] ||
          n["amount"] ||
          0
        );

      return {

        staff:
          n["staff name"] || "-",

        category:
          n["category"] || "-",

        item:
          n["expense item"] || "-",

        supplier:
          n["supplier/vendor"] || "-",

        qty,

        unitCost,

        total:
          qty * unitCost

      };

    });



    await loadFirestoreData();

  } catch (error) {

    console.error(error);

    alert(
      "Could not load business data"
    );

  }

}



/* XP */

function staffXP() {

  let xp = {};

  sales.forEach(x => {

    if (
      x.staff &&
      x.staff !== "-"
    ) {

      xp[x.staff] =
        (xp[x.staff] || 0) + 10;

    }

  });

  orders.forEach(x => {

    if (
      x.status &&
      x.status.toLowerCase() ===
      "completed"
    ) {

      const staff =
        x.uploadedBy || "Unknown";

      xp[staff] =
        (xp[staff] || 0) + 15;

    }

  });

  return Object.entries(xp)
    .map(([name, points]) => ({
      name,
      points,
      rank:
        points >= 700
          ? "Fashion Master"
          : points >= 300
          ? "Gold Stylist"
          : points >= 100
          ? "Silver Stylist"
          : "Bronze Stylist"
    }))
    .sort(
      (a, b) =>
        b.points - a.points
    );

}



/* RENDER */

function render() {

  const salesTable =
    document.getElementById("salesTable");

  const inventoryTable =
    document.getElementById("inventoryTable");

  const expensesTable =
    document.getElementById("expensesTable");

  const ordersTable =
    document.getElementById("ordersTable");

  const customersTable =
    document.getElementById("customersTable");

  const leaderboard =
    document.getElementById("leaderboard");



  /* SALES */

  if (salesTable) {

    salesTable.innerHTML =
      sales.map(x => `
        <tr>
          <td>${x.staff}</td>
          <td>${x.category}</td>
          <td>${x.product}</td>
          <td>${x.qty}</td>
          <td>${money(x.amount)}</td>
        </tr>
      `).join("");

  }



  /* INVENTORY */

  if (inventoryTable) {

    inventoryTable.innerHTML =
      inventory.map(x => `
        <tr>
          <td>${x.category}</td>
          <td>${x.product}</td>
          <td>${x.sku}</td>
          <td>${x.supplier}</td>
          <td>${x.quantity}</td>
          <td>${money(x.cost)}</td>
          <td>${money(x.selling)}</td>
        </tr>
      `).join("");

  }



  /* EXPENSES */

  if (expensesTable) {

    expensesTable.innerHTML =
      expenses.map(x => `
        <tr>
          <td>${x.staff}</td>
          <td>${x.category}</td>
          <td>${x.item}</td>
          <td>${x.supplier}</td>
          <td>${x.qty}</td>
          <td>${money(x.unitCost)}</td>
          <td>${money(x.total)}</td>
        </tr>
      `).join("");

  }



  /* ORDERS */

  if (ordersTable) {

    ordersTable.innerHTML =
      orders.length
        ? orders.map(x => `
          <tr>
            <td>${x.customer}</td>
            <td>${x.phone}</td>
            <td>${x.product}</td>
            <td>${x.status}</td>
            <td>${x.delivery}</td>
            <td>${money(x.amount)}</td>
            <td>${money(x.deposit)}</td>
            <td>${money(x.balance)}</td>
          </tr>
        `).join("")
        : `
          <tr>
            <td colspan="8">
              No orders found
            </td>
          </tr>
        `;

  }



  /* CUSTOMERS */

  if (customersTable) {

    customersTable.innerHTML =
      customers.length
        ? customers.map(x => `
          <tr>
            <td>${x.name}</td>
            <td>${x.phone}</td>
            <td>
              Shoulder: ${x.shoulder}<br>
              Chest: ${x.chest}<br>
              Waist: ${x.waist}<br>
              Hip: ${x.hip}<br>
              Sleeve: ${x.sleeve}<br>
              Length: ${x.length}
            </td>
            <td>${x.notes}</td>
          </tr>
        `).join("")
        : `
          <tr>
            <td colspan="4">
              No customer measurements found
            </td>
          </tr>
        `;

  }



  /* DASHBOARD */

  const totalSalesAmount =
    sales.reduce(
      (sum, item) =>
        sum +
        Number(item.amount || 0),
      0
    );

  const totalExpensesAmount =
    expenses.reduce(
      (sum, item) =>
        sum +
        Number(item.total || 0),
      0
    );

  const netProfitAmount =
    totalSalesAmount -
    totalExpensesAmount;

  const inventoryValueAmount =
    inventory.reduce(
      (sum, item) =>
        sum +
        Number(
          item.quantity *
          item.cost || 0
        ),
      0
    );



  const totalSales =
    document.getElementById("totalSales");

  const totalExpenses =
    document.getElementById("totalExpenses");

  const netProfit =
    document.getElementById("netProfit");

  const inventoryValue =
    document.getElementById("inventoryValue");



  if (totalSales)
    totalSales.textContent =
      money(totalSalesAmount);

  if (totalExpenses)
    totalExpenses.textContent =
      money(totalExpensesAmount);

  if (netProfit)
    netProfit.textContent =
      money(netProfitAmount);

  if (inventoryValue)
    inventoryValue.textContent =
      money(inventoryValueAmount);



  /* XP */

  if (leaderboard) {

    leaderboard.innerHTML =
      staffXP().map((x, i) => `
        <div class="rank-card">
          <span>
            #${i + 1}
            <b>${x.name}</b>
            <br>
            ${x.rank}
          </span>

          <strong>
            ${x.points} XP
          </strong>
        </div>
      `).join("");

  }

}
```
