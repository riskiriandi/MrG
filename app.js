let state={
  story:"",
  characters:[],
  styleDesc:"",
  scenes:[],
  apiKeys:JSON.parse(localStorage.getItem("mrg_keys")||"[]"),
  apiIndex:0
};

function showTab(n){
  document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
  document.getElementById("tab"+n).classList.add("active");
  document.querySelectorAll(".nav-item").forEach((x,i)=>{
    x.classList.toggle("active",i===n-1);
  });
}

function getKey(){return state.apiKeys[state.apiIndex]}
function rotateKey(){state.apiIndex=(state.apiIndex+1)%state.apiKeys.length}

async function callAI(prompt){
  if(!getKey()) throw new Error("No API key available");
  try{
    const res=await fetch("https://gen.pollinations.ai/v1/chat/completions",{
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        "Authorization":"Bearer "+getKey()
      },
      body:JSON.stringify({
        model:"openai",
        messages:[{role:"user",content:prompt}]
      })
    });
    if(res.status===429){
      rotateKey();
      await new Promise(r=>setTimeout(r,15000));
      return callAI(prompt);
    }
    const j=await res.json();
    return j.choices[0].message.content;
  }catch(e){throw e}
}

async function generateStory(){
  const idea=document.getElementById("storyIdea").value;
  if(!idea) return alert("Isi ide dulu");
  document.getElementById("status1").innerText="AI sedang menulis cerita…";
  const story=await callAI("Tulis cerita pendek: "+idea);
  state.story=story;
  document.getElementById("storyText").innerText=story;
  document.getElementById("storyResult").classList.remove("hidden");

  const chars=await callAI("Ekstrak tokoh dalam JSON array {name,desc} dari cerita:\n"+story);
  state.characters=JSON.parse(chars);

  const tagWrap=document.getElementById("charTags");
  tagWrap.innerHTML="";
  state.characters.forEach(c=>{
    const t=document.createElement("span");
    t.className="char-tag";
    t.innerText=c.name;
    tagWrap.appendChild(t);
  });

  renderCharCards();
}

function renderCharCards(){
  const g=document.getElementById("charGrid");
  g.innerHTML="";
  state.characters.forEach(c=>{
    const d=document.createElement("div");
    d.className="char-card";
    d.innerHTML=`<strong>${c.name}</strong><div class="status">waiting style</div>`;
    g.appendChild(d);
  });
}

async function saveStyle(){
  state.styleDesc="cinematic humanoid cat style based on reference";
  document.getElementById("styleStatus").innerText="Style locked. Generating characters…";

  const cards=document.querySelectorAll(".char-card");
  for(let i=0;i<cards.length;i++){
    const c=state.characters[i];
    const prompt=`${state.styleDesc}, ${c.desc}`;
    const img=`https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?width=512&height=512`;
    cards[i].innerHTML=`<img src="${img}"><p>${c.name}</p>`;
  }
}

async function generateScenes(){
  const grid=document.getElementById("sceneGrid");
  grid.innerHTML="";
  for(let i=1;i<=8;i++){
    const box=document.createElement("div");
    box.className="scene-box";
    box.innerHTML=`<div class="status">Scene ${i}</div>`;
    grid.appendChild(box);
  }
}
