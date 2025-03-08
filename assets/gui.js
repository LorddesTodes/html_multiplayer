export class GUI {
  constructor(width, height, background, mouseLock) {
      this.width = width;
      this.height = height;
      this.background = background;
      this.mouseLock = mouseLock;
      this.settings = {
          maxSlots: 9,
          maxItemsPerSlot: 64,
          hotbarSize: 300
      };
      this.slots = [].fill({id:"van:air",amount:0,slot:-1},0,this.settings.maxSlots);
      this.slots.forEach((v,i)=>{if(v.slot == -1) this.slots[i]={id:"van:air",amount:0,slot:i+1}})
      this.selectedSlot = 0;
      this.buttons = [];
      this.container = document.createElement('div');
      this.container.style.width = `${width}px`;
      this.container.style.height = `${height}px`;
      this.container.style.background = `url(${background})`;
      this.container.style.position = 'absolute';
      this.container.style.border = '2px solid black';
      this.container.style.display = 'none';
      document.body.appendChild(this.container);
  }

  set_settings(settings) {
      this.settings = settings;
  }

  toggleMouseLock(enable) {
      if (this.mouseLock) {
          if (enable) {
              document.exitPointerLock();
          } else {
              document.body.requestPointerLock();
          }
      }
  }

  open() {
      this.container.style.display = 'block';
      this.toggleMouseLock(true);
  }

  close() {
      this.container.style.display = 'none';
      this.toggleMouseLock(false);
  }

  addSlot(x, y, texture, amount, hover) {
      if (amount === 0) return;

      const slot = document.createElement('div');
      slot.style.width = '32px';
      slot.style.height = '32px';
      slot.style.position = 'absolute';
      slot.style.left = `${x}px`;
      slot.style.top = `${y}px`;
      slot.style.background = `url(${texture}) center/cover`;
      
      if (hover) {
          slot.title = hover;
      }
      
      if (amount > 1) {
          const count = document.createElement('span');
          count.innerText = amount;
          count.style.position = 'absolute';
          count.style.bottom = '0';
          count.style.right = '0';
          count.style.color = 'white';
          count.style.background = 'rgba(0, 0, 0, 0.5)';
          slot.appendChild(count);
      }

      this.container.appendChild(slot);
      this.slots.push(slot);
      return slot;
  }

  addButton(x, y, text, onClick) {
      const button = document.createElement('button');
      button.innerText = text;
      button.style.position = 'absolute';
      button.style.left = `${x}px`;
      button.style.top = `${y}px`;
      button.style.padding = '5px 10px';
      button.style.border = '2px solid gray';
      button.style.background = 'linear-gradient(to bottom, #d8d8d8, #a0a0a0)';
      button.style.cursor = 'pointer';
      button.onclick = onClick;
      
      this.container.appendChild(button);
      this.buttons.push(button);
      return button;
  }

  render() {
      document.body.appendChild(this.container);
  }

  setSelectedSlot(index) {
      if (index >= 0 && index < this.settings.maxSlots) {
          this.selectedSlot = index;
          this.updateHotbar('hotbar', this.slots);
      }
  }

  changeSelectedSlot(offset) {
      this.selectedSlot = (this.selectedSlot + offset + this.settings.maxSlots) % this.settings.maxSlots;
      this.updateHotbar('hotbar', this.slots);
  }

  getSelectedSlot() {
    if(this.slots[this.selectedSlot]){
        if(this.slots[this.selectedSlot].amount > 0) {
            return this.slots[this.selectedSlot];
        }
        return {id:"van:air",amount:0};
    }else{
        return null
    }
  }
  removeFromSelected_slot(am){
    if(this.slots[this.selectedSlot]){
        this.slots[this.selectedSlot].amount -= am;
        if(this.slots[this.selectedSlot].amount <= 0) {
            this.slots[this.selectedSlot] = {id:"van:air",amount:0};
        }
        this.updateHotbar('hotbar', this.slots);
    }
  }
  addItemToHotbar(moid,am){
    let cam = am
    if(this.slots && this.settings.maxSlots>0){
        this.slots.forEach((v,i)=>{
            if(cam == 0) {
                this.updateHotbar('hotbar', this.slots)
                return;
            }
            if((v.id == moid || v.id == "van:air") && v.amount <= this.settings.maxItemsPerSlot){
                let cal = this.settings.maxItemsPerSlot - v.amount
                if(cam >= cal){
                    this.slots[i].amount += cal
                    cam -= cal
                    this.slots[i].id = moid
                }else{
                    this.slots[i].amount += cam
                    cam = 0
                    this.slots[i].id = moid
                }
            }
        })
        this.updateHotbar('hotbar', this.slots);
    }
  }

  updateHotbar(hotbarId, items) {
    const hotbar = document.getElementById(hotbarId);
    if (!hotbar) {
        console.warn("Hotbar element not found");
        return;
    }
    this.slots = items;
    hotbar.innerHTML = '';
    hotbar.style.width = `${this.settings.hotbarSize*1.15}px`;
    hotbar.style.height = `${this.settings.hotbarSize}px`;
    hotbar.style.position = 'fixed';
    hotbar.style.left = '50%';
    hotbar.style.bottom = `-${this.settings.hotbarSize / 2.5}px`;
    hotbar.style.transform = 'translateX(-50%)';
    hotbar.style.display = 'flex';
    hotbar.style.justifyContent = 'center';
    hotbar.style.alignItems = 'center';
    hotbar.style.gap = '5px';
     
    const slotWidth = this.settings.hotbarSize / this.settings.maxSlots;
      
    for (let i = 0; i < this.settings.maxSlots; i++) {
        const item = items[i];
        const slot = document.createElement('div');
        slot.className = 'hotbar-slot';
        slot.style.width = `${slotWidth}px`;
        slot.style.height = `${slotWidth}px`;
        slot.style.display = 'flex';
        slot.style.alignItems = 'flex-end';
        slot.style.justifyContent = 'flex-end';
        slot.style.backgroundSize = 'cover';
        slot.style.backgroundPosition = 'center';
        slot.style.position = 'relative';
        slot.style.border = i === this.selectedSlot ? '2px solid yellow' : '2px solid gray';
        slot.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
          
        if (item && item.amount > 0) {
            let tx = item.id
            let mod = tx.slice(0,tx.lastIndexOf(":"))
            let id = tx.slice(tx.lastIndexOf(":")+1)
            slot.style.backgroundImage = `url(./../resources/textures/assets/${mod}/${id}.png)`;
            if (item.amount > 1) {
                const count = document.createElement('span');
                count.innerText = item.amount;
                count.style.position = 'absolute';
                count.style.bottom = '2px';
                count.style.right = '2px';
                count.style.color = 'white';
                count.style.fontSize = '14px';
                count.style.fontWeight = 'bold';
                count.style.background = 'rgba(0, 0, 0, 0.7)';
                count.style.padding = '2px 4px';
                count.style.borderRadius = '4px';
                slot.appendChild(count);
            }
        }
        hotbar.appendChild(slot);
    }
  }
}
