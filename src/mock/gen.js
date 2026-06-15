const fs = require("fs");
const OUT = __dirname;
const R = arr => arr[Math.floor(Math.random()*arr.length)];
const RI = (a,b) => Math.floor(Math.random()*(b-a+1))+a;
const rDate = (y1,y2) => { const s=new Date(y1,0,1).getTime(),e=new Date(y2,11,31).getTime(); return new Date(s+Math.random()*(e-s)).toISOString().split("T")[0]; };
const rDT = (y1,y2) => { const s=new Date(y1,0,1).getTime(),e=new Date(y2,11,31).getTime(); return new Date(s+Math.random()*(e-s)).toISOString(); };
const ph = () => "("+RI(200,999)+") "+RI(200,999)+"-"+RI(1000,9999);
const FN=["James","John","Robert","Michael","William","David","Richard","Joseph","Thomas","Charles","Mary","Patricia","Jennifer","Linda","Barbara","Elizabeth","Susan","Jessica","Sarah","Karen","Emily","Emma","Olivia","Ava","Isabella","Sophia","Mia","Charlotte","Amelia","Harper","Liam","Noah","Oliver","Elijah","Mason","Logan","Lucas","Jackson","Aiden","Luna","Aria","Chloe","Penelope","Layla","Riley","Zoey","Nora","Lily","Eleanor","Marcus","Andre","Malik","Jayla","Destiny","Aaliyah","Zoe","Jasmine","Keisha","Tyrone","Latoya","Darius","Tamika","Janelle","Rashid","Fatima","Amara","Priya","Raj","Ananya","Vikram","Divya","Arun","Meera","Wei","Ming","Yan","Hui","Lin","Yang","Mei","Yuki","Hana","Kenji","Carlos","Maria","Juan","Ana","Luis","Rosa","Miguel","Elena","Diego","Sofia"];
const LN=["Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Rodriguez","Martinez","Hernandez","Lopez","Gonzalez","Wilson","Anderson","Thomas","Taylor","Moore","Jackson","Martin","Lee","Perez","Thompson","White","Harris","Sanchez","Clark","Ramirez","Lewis","Robinson","Walker","Young","Allen","King","Wright","Scott","Torres","Nguyen","Hill","Flores","Green","Adams","Nelson","Baker","Hall","Rivera","Campbell","Mitchell","Carter","Roberts","Chen","Kim","Park","Patel","Shah","Kumar","Singh","Sharma","Gupta","Ali","Hassan","Ahmed","Washington","Jefferson","Franklin"];
const STREETS=["Main St","Oak Ave","Elm St","Park Blvd","Cedar Rd","Maple Dr","Pine St","Lake View Dr","Hill Rd","Valley Ln"];
const CITIES=["Austin","Houston","Dallas","San Antonio","Fort Worth","El Paso","Arlington","Corpus Christi","Plano","Lubbock","Irving"];
const INSURERS=["Delta Dental","Cigna","Aetna","MetLife","United Concordia"];
const CLINICS=["clinic-1a","clinic-1b","clinic-1c","clinic-2a","clinic-2b","clinic-2c","clinic-2d","clinic-2e","clinic-3a","clinic-3b","clinic-4a","clinic-4b","clinic-4c"];
const DIDS=["STF-0001","STF-0002","STF-0003","STF-0004","STF-0005","STF-0006","STF-0007","STF-0008"];
const DNAMES=["Dr. Sarah Martinez","Dr. James Chen","Dr. Emily Rodriguez","Dr. Michael Thompson","Dr. Lisa Park","Dr. Robert Davis","Dr. Jennifer Wilson","Dr. David Kim"];
const CONDITIONS=["Hypertension","Type 2 Diabetes","Heart Disease","Asthma","Thyroid Disorder","Arthritis","Anxiety","Depression"];
const ALLERGIES=["Penicillin","Latex","Aspirin","Ibuprofen","Codeine","Sulfa drugs"];
const MEDS=["Lisinopril","Metformin","Atorvastatin","Amlodipine","Omeprazole","Levothyroxine","Albuterol","Sertraline"];
const TAGS=["VIP","Recall Due","Payment Plan","New Patient","High Risk","Insurance Issue","Referred"];
const PROCS=[{code:"D0120",description:"Periodic Oral Evaluation",fee:65},{code:"D0210",description:"Full Mouth X-rays",fee:145},{code:"D0330",description:"Panoramic X-ray",fee:185},{code:"D1110",description:"Adult Prophylaxis",fee:115},{code:"D2140",description:"Amalgam Restoration",fee:185},{code:"D2392",description:"Composite Resin (3 surfaces)",fee:285},{code:"D2740",description:"Crown - Porcelain",fee:1350},{code:"D3310",description:"Root Canal - Anterior",fee:895},{code:"D3330",description:"Root Canal - Molar",fee:1200},{code:"D4341",description:"Periodontal Scaling",fee:265},{code:"D7140",description:"Simple Extraction",fee:185},{code:"D7210",description:"Surgical Extraction",fee:350},{code:"D6010",description:"Implant Placement",fee:2400},{code:"D8080",description:"Comprehensive Orthodontic Treatment",fee:5500}];
const TEETH=["#2","#3","#4","#5","#6","#7","#8","#9","#10","#11","#12","#13","#14","#15","#18","#19","#20","#21","#22","#23","#24","#25","#26","#27","#28","#29","#30","#31"];
const AIDS=["agent-receptionist","agent-insurance","agent-scribe","agent-claims"];
const ANAMES=["AI Receptionist","AI Insurance","AI Scribe","AI Claims"];
const JSTAGES=[{stage:"Lead Created",notes:"Patient registered via web form"},{stage:"Appointment Booked",notes:"Initial exam scheduled"},{stage:"Insurance Verified",notes:"Insurance coverage confirmed"},{stage:"Visit Completed",notes:"Examination and cleaning performed"},{stage:"X-ray Uploaded",notes:"Bitewing X-rays captured and analyzed"},{stage:"Treatment Plan Created",notes:"Treatment plan recommended"},{stage:"Claim Submitted",notes:"Claim submitted to insurance"},{stage:"Payment Received",notes:"Patient co-pay collected"},{stage:"Recall Scheduled",notes:"6-month recall set for follow-up"}];

const patients=[];
for(let i=1;i<=100;i++){
  const fn=R(FN),ln=R(LN);
  const dob=rDate(1945,2018);
  const born=new Date(dob);const now2=new Date();let a=now2.getFullYear()-born.getFullYear();if(now2<new Date(now2.getFullYear(),born.getMonth(),born.getDate()))a--;
  const ins=R(INSURERS);const am=R([1000,1500,2000]);const au=RI(0,am);const ded=R([50,100]);const dm=RI(0,ded);
  const cln=R(CLINICS);const dIdx=RI(0,7);
  const numJ=RI(4,9);
  const journey=JSTAGES.slice(0,numJ).map((s,ji)=>{const aIdx=Math.random()>0.5?RI(0,3):null;const st=ji<numJ-2?"completed":R(["completed","in_progress","pending"]);return{id:"j-"+i+"-"+ji,stage:s.stage,date:rDate(2023,2025),status:st,agentId:aIdx!==null?AIDS[aIdx]:null,agentName:aIdx!==null?ANAMES[aIdx]:null,notes:s.notes};});
  const comms=[{id:"cm-"+i+"-1",channel:"SMS",direction:"outbound",timestamp:rDT(2024,2025),preview:"Your appointment is confirmed for tomorrow at 10:00 AM.",agentGenerated:true},{id:"cm-"+i+"-2",channel:"Email",direction:"outbound",timestamp:rDT(2024,2025),preview:"Your insurance has been verified for your upcoming visit.",agentGenerated:true},{id:"cm-"+i+"-3",channel:"SMS",direction:"inbound",timestamp:rDT(2024,2025),preview:"Yes that time works. See you then!",agentGenerated:false},{id:"cm-"+i+"-4",channel:"Voice",direction:"inbound",timestamp:rDT(2024,2025),preview:"Patient called to schedule a cleaning appointment.",agentGenerated:false}];
  const dh=Array.from({length:RI(2,5)},(_,hi)=>({date:rDate(2020,2025),procedure:R(PROCS).description,tooth:R([...TEETH,null]),dentistId:DIDS[dIdx],notes:"Procedure completed successfully"}));
  const tp=Math.random()>0.4?[{id:"tp-"+i,date:rDate(2024,2025),dentistId:DIDS[dIdx],procedures:[Object.assign({},R(PROCS),{tooth:R(TEETH)}),Object.assign({},R(PROCS),{tooth:R(TEETH)})],totalCost:RI(800,4000),insuranceEstimate:RI(400,2000),patientEstimate:RI(200,1500),status:R(["Proposed","Accepted","Declined","In Progress","Completed"])}]:[];
  const hasNext=Math.random()>0.4;
  patients.push({id:"PAT-"+String(i).padStart(4,"0"),photo:"https://api.dicebear.com/7.x/personas/svg?seed="+fn+ln+i,firstName:fn,lastName:ln,dateOfBirth:dob,age:a,gender:R(["Male","Female","Female","Female"]),phone:ph(),email:fn.toLowerCase()+"."+ln.toLowerCase()+i+"@email.com",address:{street:RI(100,9999)+" "+R(STREETS),city:R(CITIES),state:"TX",zip:String(RI(70000,79999))},insurancePrimary:{insurerId:"ins-"+ins.replace(/ /g,"-").toLowerCase(),insurerName:ins,memberId:"MBR"+RI(100000,999999),groupNumber:"GRP"+RI(10000,99999),effectiveDate:RI(2020,2024)+"-01-01",copay:RI(10,50),deductible:ded,deductibleMet:dm,annualMax:am,annualUsed:au,coveragePreventive:100,coverageBasic:80,coverageMajor:50,coverageOrthodontic:50,eligibilityVerified:Math.random()>0.1,lastVerifiedDate:rDate(2024,2025)},medicalHistory:Array.from({length:RI(0,3)},()=>({condition:R(CONDITIONS),diagnosedDate:rDate(2010,2022),notes:"Managed with medication"})),allergies:Math.random()>0.5?[R(ALLERGIES)]:[],medications:Math.random()>0.5?[R(MEDS)]:[],dentalHistory:dh,treatmentPlans:tp,claims:[],invoices:[],communications:comms,documents:[{id:"doc-"+i+"-1",name:"Consent Form",type:"PDF",uploadDate:rDate(2023,2025),size:"142 KB"},{id:"doc-"+i+"-2",name:"Insurance Card",type:"Image",uploadDate:rDate(2023,2025),size:"84 KB"}],journey,recallDue:rDate(2024,2026),lastVisit:rDate(2023,2025),nextAppointment:hasNext?new Date(Date.now()+RI(1,30)*86400000).toISOString().split("T")[0]:undefined,riskScore:R(["Low","Low","Low","Medium","Medium","High"]),lifetimeValue:RI(500,15000),outstandingBalance:RI(0,2500),clinic:cln,assignedDentist:DIDS[dIdx],tags:[...new Set(Array.from({length:RI(0,3)},()=>R(TAGS)))],createdAt:rDate(2020,2024),notes:R(["Patient prefers morning appointments","Anxious about dental procedures","Refers family members regularly","On a payment plan","","",""])});
}
fs.writeFileSync(OUT+"/patients.json",JSON.stringify(patients,null,2));
console.log("patients:"+patients.length);

const TYPES=["Cleaning","Exam","Filling","Root Canal","Crown","Extraction","Implant","Orthodontic","Emergency"];
const REV={"Cleaning":115,"Exam":185,"Filling":285,"Root Canal":1200,"Crown":1350,"Extraction":350,"Implant":2400,"Orthodontic":500,"Emergency":250};
const appointments=[];const nowTs=new Date();
for(let i=1;i<=220;i++){
  const pat=R(patients);const dIdx=RI(0,7);const dayOff=RI(-30,30);
  const d=new Date(nowTs);d.setDate(d.getDate()+dayOff);d.setHours(RI(8,16),0,0,0);
  const dur=R([30,45,60,90]);const end=new Date(d.getTime()+dur*60000);
  const isPast=dayOff<0;
  const status=isPast?R(["Completed","Completed","Completed","No Show","Cancelled"]):R(["Scheduled","Confirmed","Confirmed","Scheduled"]);
  const t=R(TYPES);
  appointments.push({id:"APT-"+String(i).padStart(4,"0"),patientId:pat.id,patientName:pat.firstName+" "+pat.lastName,dentistId:DIDS[dIdx],dentistName:DNAMES[dIdx],clinicId:pat.clinic,startTime:d.toISOString(),endTime:end.toISOString(),type:t,status,chair:"Chair "+RI(1,4),notes:R(["Routine visit","Patient has anxiety","Pre-auth required","Follow-up from last visit","New patient exam",""]),insuranceVerified:Math.random()>0.2,preAuthRequired:Math.random()>0.7,estimatedRevenue:REV[t]||RI(100,1500),createdBy:R(DIDS),createdAt:new Date(d.getTime()-RI(1,30)*86400000).toISOString()});
}
fs.writeFileSync(OUT+"/appointments.json",JSON.stringify(appointments,null,2));
console.log("appointments:"+appointments.length);

const CSTATS=["Draft","Submitted","Pending","Approved","Denied","Appealed","Paid"];
const DENIALS=["Missing X-ray attachment","Pre-authorization required","Benefit maximum reached","Service not covered","Duplicate claim","Invalid CDT code"];
const claims=[];
for(let i=1;i<=150;i++){
  const pat=R(patients);const status=R(CSTATS);
  const ps=Array.from({length:RI(1,3)},()=>Object.assign({},R(PROCS),{tooth:R(TEETH)}));
  const tb=ps.reduce((s,p)=>s+p.fee,0);
  const ta=Math.round(tb*RI(70,95)/100);
  const tp2=["Paid","Approved"].includes(status)?ta:status==="Pending"?Math.round(ta*0.5):0;
  const ais=RI(55,99);
  claims.push({id:"CLM-"+String(i).padStart(4,"0"),patientId:pat.id,patientName:pat.firstName+" "+pat.lastName,insurerId:pat.insurancePrimary.insurerId,insurerName:pat.insurancePrimary.insurerName,clinicId:pat.clinic,procedureCodes:ps,totalBilled:tb,totalAllowed:ta,totalPaid:tp2,patientResponsibility:tb-tp2,status,submittedDate:status==="Draft"?null:rDate(2024,2025),processedDate:["Paid","Approved","Denied"].includes(status)?rDate(2024,2025):null,denialReason:status==="Denied"?R(DENIALS):null,aiScore:ais,aiFlags:ais<75?[R(["Missing X-ray","Pre-auth required","Incomplete documentation"])]:[],attachments:Math.random()>0.5?["xray-periapical.jpg"]:["consent-form.pdf"],notes:R(["","Standard submission","Appeal in progress","Resubmitted with corrections",""])});
}
fs.writeFileSync(OUT+"/claims.json",JSON.stringify(claims,null,2));
console.log("claims:"+claims.length);

const PMETHODS=["Cash","Check","Credit Card","ACH","CareCredit"];
const invoices=[];
for(let i=1;i<=120;i++){
  const pat=R(patients);
  const ps=Array.from({length:RI(1,4)},()=>Object.assign({},R(PROCS),{tooth:R(TEETH)}));
  const tb=ps.reduce((s,p)=>s+p.fee,0);
  const ip=Math.round(tb*RI(40,80)/100);
  const bal=tb-ip;const pct=R([0,0,0,0.5,1]);const paid=Math.round(bal*pct);const rem=bal-paid;
  const dueDate=rDate(2024,2025);
  const isPastDue=new Date(dueDate)<new Date()&&rem>0;
  const st=rem===0?"Paid":paid>0?"Partial":isPastDue?"Overdue":"Outstanding";
  invoices.push({id:"INV-"+String(i).padStart(4,"0"),patientId:pat.id,patientName:pat.firstName+" "+pat.lastName,clinicId:pat.clinic,date:rDate(2024,2025),procedures:ps,totalBilled:tb,insurancePaid:ip,patientPaid:paid,balance:rem,status:st,dueDate,paymentHistory:paid>0?[{id:"pay-"+i,date:rDate(2024,2025),amount:paid,method:R(PMETHODS),notes:""}]:[],notes:""});
}
fs.writeFileSync(OUT+"/invoices.json",JSON.stringify(invoices,null,2));
console.log("invoices:"+invoices.length);
console.log("ALL DONE");
