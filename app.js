const cardStates = {};

async function initRoadmap() {
    try {
        const [milestonesRes, devRes, backlogRes] = await Promise.all([
            fetch('./data/milestones.json'),
            fetch('./data/development.json'),
            fetch('./data/backlog.json')
        ]);

        const milestones = await milestonesRes.json();
        const development = await devRes.json();
        const backlog = await backlogRes.json();

        renderMilestones(milestones);
        renderDevelopment(development);
        renderBacklog(backlog);
    } catch (error) {
        console.error("Error loading roadmap data:", error);
    }
}

function renderMilestones(data) {
    const container = document.getElementById('milestone-container');
    if (!container) return;

    container.innerHTML = data.map((m, index) => {
        const id = `card-${index}`;
        cardStates[id] = { scale: 1, x: 0, y: 0, isDragging: false };
        return `
        <div class="relative pl-16">
            <div class="absolute left-6 top-6 w-3 h-3 ${index === 0 ? 'bg-blue-500' : 'bg-slate-300'} rounded-full border-4 border-white ring-1 ring-slate-200 z-10"></div>
            <div class="tile-card" id="${id}">
                <div class="p-6 flex justify-between items-center cursor-pointer group" onclick="this.parentElement.classList.toggle('active')">
                    <div>
                        <span class="mono text-[10px] font-bold text-slate-400 uppercase tracking-widest">Completed: ${m.date}</span>
                        <h3 class="text-lg font-bold group-hover:text-blue-600 transition-colors">${m.title}</h3>
                    </div>
                    <svg class="chevron w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                </div>
                <div class="content-wrapper">
                    <div class="px-6 pb-6 border-t border-slate-50 pt-4">
                        <div class="viewport bg-checkerboard border border-slate-100 mb-4" 
                             onmousedown="startPan(event, '${id}')" 
                             onmousemove="doPan(event, '${id}')" 
                             onmouseup="endPan('${id}')" 
                             onmouseleave="endPan('${id}')">
                            <div class="zoom-controls">
                                <button class="control-btn" onclick="adjustZoom(event, '${id}', 0.5)">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" stroke-width="2"/></svg>
                                </button>
                                <button class="control-btn" onclick="adjustZoom(event, '${id}', -0.5)">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20 12H4" stroke-width="2"/></svg>
                                </button>
                                <button class="control-btn" onclick="resetZoom(event, '${id}')">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 4v5h5M20 20v-5h-5M4 20l5-5M20 4l-5 5" stroke-width="2"/></svg>
                                </button>
                            </div>
                            <img src="${m.image}" id="img-${id}" class="pixel-art cursor-grab" style="transform: translate(-50%, -50%) scale(1);">
                        </div>
                        <p class="text-blue-600 mono text-[10px] font-bold uppercase mb-1">Duration: ${m.Duration || 'N/A'}</p>
                        <p class="text-slate-600 text-sm">${m.description}</p>
                    </div>
                </div>
            </div>
        </div>`;
    }).join('');
}

function renderDevelopment(data) {
    const container = document.getElementById('development-container');
    if (!container) return;
    container.innerHTML = data.map(item => `
        <div class="p-8 border-2 border-blue-100 bg-blue-50/30 rounded-2xl mb-6">
            <div class="flex flex-col md:flex-row justify-between mb-4">
                <h3 class="text-xl font-bold text-blue-900">${item.title}</h3>
                <span class="mono text-xs font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded-full h-fit">Target: ${item.target}</span>
            </div>
            <ul class="space-y-2 mb-6">${item.tasks.map(t => `<li class="text-slate-700 text-sm flex"><span class="text-blue-500 mr-2">•</span>${t}</li>`).join('')}</ul>
            <div class="w-full bg-blue-100 rounded-full h-2"><div class="bg-blue-500 h-2 rounded-full transition-all duration-1000" style="width: ${item.progress}%"></div></div>
            <p class="text-[10px] mono mt-2 text-blue-400 font-bold uppercase">Progress: ${item.progress}%</p>
        </div>`).join('');
}

function renderBacklog(data) {
    const container = document.getElementById('backlog-container');
    if (!container) return;
    container.innerHTML = data.map(item => `
        <div class="flex items-center p-4 bg-white border border-slate-200 rounded-lg">
            <div class="w-2 h-2 rounded-full bg-slate-300 mr-4"></div>
            <span class="text-slate-700 font-medium">${item.task}</span>
            <span class="ml-auto mono text-[10px] text-slate-400 font-bold uppercase">Priority: ${item.priority}</span>
        </div>`).join('');
}

function updateView(id) {
    const s = cardStates[id];
    const img = document.getElementById(`img-${id}`);
    if (img) img.style.transform = `translate(calc(-50% + ${s.x}px), calc(-50% + ${s.y}px)) scale(${s.scale})`;
}

function adjustZoom(e, id, amt) { e.stopPropagation(); cardStates[id].scale = Math.max(0.1, Math.min(15, cardStates[id].scale + amt)); updateView(id); }
function resetZoom(e, id) { e.stopPropagation(); cardStates[id] = { scale: 1, x: 0, y: 0, isDragging: false }; updateView(id); }
function startPan(e, id) { e.preventDefault(); const s = cardStates[id]; s.isDragging = true; s.startX = e.clientX - s.x; s.startY = e.clientY - s.y; document.getElementById(`img-${id}`).classList.replace('cursor-grab', 'cursor-grabbing'); }
function doPan(e, id) { const s = cardStates[id]; if (!s.isDragging) return; s.x = e.clientX - s.startX; s.y = e.clientY - s.startY; updateView(id); }
function endPan(id) { if (!cardStates[id]) return; cardStates[id].isDragging = false; const img = document.getElementById(`img-${id}`); if (img) img.classList.replace('cursor-grabbing', 'cursor-grab'); }

// Run the engine
document.addEventListener('DOMContentLoaded', initRoadmap);