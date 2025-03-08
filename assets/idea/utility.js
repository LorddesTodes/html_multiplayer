export class Utility {
    constructor() {
        
    }
    joinHtmlPath(...segments) {
        return segments
            .map(segment => segment.replace(/^\/+|\/+$/g, '')) // Remove leading & trailing slashes
            .filter(segment => segment.length > 0) // Remove empty segments
            .join('/'); // Join with "/"
    }
    rand() {
        const tmp2 = Math.random().toString(36).substr(2);
        const ri = Math.floor(Math.random() * tmp2.length);
        return tmp2.slice(ri, ri + 1);
    };
    
        // Generate a random token of a given length
    token(len) {
        let tmp = '';
        for (let i = 0; i < len; i++) {
            tmp = tmp + this.rand();
        }
        return tmp;
    };
    turnIAItoURL(mod,item){
        return this.joinHtmlPath(this.href,"resources/textures/assets/",mod,item)+".png"
    }
    fullidToST(full){
        let mod = full.slice(0,full.lastIndexOf(":"))
        let id = full.slice(full.lastIndexOf(":")+1)
        return {mod:mod,id:id}
    }
    fulltoURL(full){
        let st = this.fullidToST(full)
        return this.turnIAItoURL(st.mod,st.id)
    }
}