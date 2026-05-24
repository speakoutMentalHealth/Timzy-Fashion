let sales=JSON.parse(localStorage.getItem('tf_sales'))||[];
let inventory=JSON.parse(localStorage.getItem('tf_inventory'))||[];
let orders=JSON.parse(localStorage.getItem('tf_orders'))||[];
let customers=JSON.parse(localStorage.getItem('tf_customers'))||[];

const money=n=>'₦'+Number(n||0).toLocaleString();
const save=()=>{localStorage.setItem('tf_sales',JSON.stringify(sales));localStorage.setItem('tf_inventory',JSON.stringify(inventory));localStorage.setItem('tf_orders',JSON.stringify(orders));localStorage.setItem('tf_customers',JSON.stringify(customers));render();};
function showTab(id){document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));document.getElementById(id).classList.add('active');}

salesForm.onsubmit=e=>{e.preventDefault();sales.push({staff:salesStaff.value,category:salesCategory.value,product:salesProduct.value,qty:+salesQty.value,amount:+salesAmount.value});e.target.reset();save();}
inventoryForm.onsubmit=e=>{e.preventDefault();inventory.push({staff:invStaff.value,category:invCategory.value,product:invProduct.value,sku:invSku.value,added:+invAdded.value,cost:+invCost.value});e.target.reset();save();}
orderForm.onsubmit=e=>{e.preventDefault();orders.push({id:orderId.value,customer:orderCustomer.value,phone:orderPhone.value,staff:orderStaff.value,status:orderStatus.value,amount:+orderAmount.value});e.target.reset();save();}
customerForm.onsubmit=e=>{e.preventDefault();customers.push({name:custName.value,phone:custPhone.value,measure:custMeasure.value,notes:custNotes.value});e.target.reset();save();}

function del(type,i){ if(type==='sales')sales.splice(i,1); if(type==='inventory')inventory.splice(i,1); if(type==='orders')orders.splice(i,1); if(type==='customers')customers.splice(i,1); save(); }

function staffXP(){
 let xp={};
 sales.forEach(x=>xp[x.staff]=(xp[x.staff]||0)+10);
 inventory.forEach(x=>xp[x.staff]=(xp[x.staff]||0)+5);
 orders.forEach(x=>{xp[x.staff]=(xp[x.staff]||0)+(x.status==='Completed'?15:(x.status==='Late'?-10:0));});
 return Object.entries(xp).map(([name,points])=>({name,points,rank:points>=700?'Fashion Master':points>=300?'Gold Stylist':points>=100?'Silver Stylist':'Bronze Stylist'})).sort((a,b)=>b.points-a.points);
}

function render(){
 let soldBySku={}; sales.forEach(s=>soldBySku[s.product]=(soldBySku[s.product]||0)+s.qty);
 salesTable.innerHTML=sales.map((x,i)=>`<tr><td>${x.staff}</td><td>${x.category}</td><td>${x.product}</td><td>${x.qty}</td><td>${money(x.amount)}</td><td><button class="delete" onclick="del('sales',${i})">Delete</button></td></tr>`).join('');
 inventoryTable.innerHTML=inventory.map((x,i)=>{let sold=soldBySku[x.sku]||0, rem=x.added-sold, status=rem<=5?'LOW':'OK'; return `<tr><td>${x.category}</td><td>${x.product}</td><td>${x.sku}</td><td>${x.added}</td><td>${sold}</td><td>${rem}</td><td class="${status==='LOW'?'low':'ok'}">${status}</td><td>${money(rem*x.cost)}</td><td><button class="delete" onclick="del('inventory',${i})">Delete</button></td></tr>`}).join('');
 ordersTable.innerHTML=orders.map((x,i)=>`<tr><td>${x.id}</td><td>${x.customer}</td><td>${x.staff}</td><td>${x.status}</td><td>${money(x.amount)}</td><td><button class="delete" onclick="del('orders',${i})">Delete</button></td></tr>`).join('');
 customersTable.innerHTML=customers.map((x,i)=>`<tr><td>${x.name}</td><td>${x.phone}</td><td>${x.measure}</td><td>${x.notes}</td><td><button class="delete" onclick="del('customers',${i})">Delete</button></td></tr>`).join('');

 let total=sales.reduce((s,x)=>s+x.amount,0), invVal=0, low=0;
 inventory.forEach(x=>{let rem=x.added-(soldBySku[x.sku]||0); invVal+=rem*x.cost; if(rem<=5)low++;});
 totalSales.textContent=money(total); totalExpenses.textContent='₦0'; netProfit.textContent=money(total); inventoryValue.textContent=money(invVal); lowStock.textContent=low; pendingOrders.textContent=orders.filter(x=>x.status==='Pending').length;

 leaderboard.innerHTML=staffXP().map((x,i)=>`<div class="rank-card"><span>#${i+1} <b>${x.name}</b><br>${x.rank}</span><strong>${x.points} XP</strong></div>`).join('') || '<p>No staff points yet.</p>';

 formLinks.innerHTML=(window.TIMZY_FORMS||[]).map(f=>`<div class="form-card"><h3>${f.name}</h3><p>${f.description}</p><a href="${f.url}" target="_blank">Open Form</a></div>`).join('');
}

function exportBackup(){let data={sales,inventory,orders,customers,exportedAt:new Date().toISOString()};let blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});let a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='timzy-fashion-os-backup.json';a.click();}
function clearData(){if(confirm('Delete all demo data on this device?')){sales=[];inventory=[];orders=[];customers=[];save();}}
render();
