
export default class Session{
    constructor(router){
        this.private = {
            enabled:false,
            data:{}
        }
        this.router = router;

        this.beforeSend = this.beforeSend.bind(this);
        this.afterSend = this.afterSend.bind(this);
        this.events = {'autorize':[],'logout':[]};
        this.paths = ['session/autorize','session/logout'];
        this.router.on('before',this.beforeSend);
        this.router.on('after',this.afterSend)

    }
    beforeSend(pack){
        return {...pack,session:this.private.data};
    }
    afterSend(pack){
        let {to,session} = pack;
        if ( this.paths.indexOf(to)<0 && ( Array.isArray(session) && session.length===0)) {
            this._clear();

        }
        
        return pack;
    }
    enabled(){
        return this.private.enabled;
    }
    autorize({login,pass,sid}){
        let t = this;
        return t.router.send({
            to:'session/autorize',
            data:{
                ...(login?{login}:{}),
                ...(pass?{pass}:{}),
                ...(sid?{sid: sid}:{}),
            }
        }).then(data=>{
            if ('login' in data){
                let prev = {...t.private,data:{...t.private.data}};
                t.private.enabled = true;    
                t.private.data = {...data};
                if (!prev.enabled || prev.data.sid !== data.sid)
                    t.do('autorize');
            }else{
                t._clear();
                throw new Error('data is empty');
            }
            return data;
        }).catch(e=>{
            t._clear();
            throw new Error(e);
        })
    }
    _clear(){
        if (this.private.enabled){
            this.do('logout');
            this.private.enabled = false;    
            this.private.data = {};
            return true;
        }
        return false;
    }
    logout(){
        if (this._clear()){
            this.router.send({to:'session/logout'});
        };
    }

    on(event,callback){
        let t = this;
        if (!(event in t.events))
            throw Error(' event="'+event+'" not in '+this.events.join(','));
        t.events[event].push(callback);
        return ()=>{ t.events[event] = t.events[event].filter(cb=>cb!==callback); }
    }
    do(event,param={}){
        let t = this;
        t.events[event].map(callback=>{
            callback({param,sender:t,event});
        })
    }
}

