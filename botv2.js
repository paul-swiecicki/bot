var bot = {
 
    botInterval: 0,
    rate: 1000,
    isRunning: false,
    isAutoNext: false,

    cp: {
        btn: '',
        btnAutoNext: '',
        panel: '',
        rateController: '',
        rateText: '',
        listForm: '',
        addToList: '',
        isHidden: false,

        init(){
            const body = document.querySelector('body');

            const oldBotPanel = document.querySelector('#botPanel');
            oldBotPanel ? (oldBotPanel.remove()) : null;

            this.all = document.createElement('div');
            this.all.setAttribute('style',`
                display: flex;
                flex-flow: column;
                justify-content: center;
                margin: 10px 0 0;
            `);

            const createCheckbox = (parentEl, el, setFunction, label, checked = false) => {
                this[parentEl] = document.createElement('div');
                this[parentEl].appendChild(document.createTextNode(label))
                this[el] = document.createElement('input');
                this[el].type = 'checkbox';
                this[el].checked = checked;
                this[el].addEventListener('change', e => {
                    if(e.target.checked){
                        bot.text[setFunction](true);
                    } else {
                        bot.text[setFunction](false);
                    }
                });
                this[parentEl].appendChild(this[el]);
                this.all.appendChild(this[parentEl]);
            }
 
            this.hideBtn = document.createElement('span');
            this.hideBtn.appendChild(document.createTextNode('HIDE'))
            this.hideBtn.classList.add('bot--btn');
            this.hideBtn.id = 'bot--hide-btn';
            this.hideBtn.addEventListener('click', e => {
                if(this.isHidden){
                    this.hideBtn.style.setProperty('background','red');
                    this.all.style.setProperty('display', 'flex');
                } else {
                    this.hideBtn.style.setProperty('background','green')
                    this.all.style.setProperty('display', 'none');
                }
                this.isHidden = !this.isHidden;
            });

            this.panel = document.createElement('div');
            this.panel.id = 'botPanel';
            this.panel.setAttribute('style',`
                padding: 10px;
                z-index: 1000;
                position: absolute;
                width: 300px;
            `);

            this.btn = document.createElement('button');
            this.btn.classList.add('bot--btn');
            this.btn.id = 'bot--switch';
            this.btn.appendChild(document.createTextNode('ON/OFF'))
            this.btn.addEventListener('click', e => {
                bot.toggle();
            });

            this.all.appendChild(this.btn);

            createCheckbox('loopDiv','loopBox','setLoop','Loop ',true);
            createCheckbox('replyDiv','replyBox','setReply','Reply Mode ');

            this.rate = document.createElement('div');
            this.rate.setAttribute('style',`
                margin: 10px 0;
                color: white;
            `);
            this.rateText = document.createElement('div');
            this.rateText.appendChild(document.createTextNode(`Send once/${bot.rate}ms`));
            
            this.rateController = document.createElement('input');
            this.rateController.type = 'range';
            this.rateController.min = 0;
            this.rateController.max = 1000;
            this.rateController.value = 1000;
            this.rateController.step = 1;
            this.rateController.addEventListener('change', e => {
                let rate = e.target.value;
                bot.changeRate(rate);
            });
            this.rateController.setAttribute('style',`
                cursor: pointer;
                width: 100%;
            `);

            this.rate.appendChild(this.rateText);
            this.rate.appendChild(this.rateController);

            this.btnAutoNext = document.createElement('button');
            this.btnAutoNext.classList.add('bot--btn');
            this.btnAutoNext.classList.add('bot--auto-next');
            this.btnAutoNext.appendChild(document.createTextNode('Auto Next'))
            this.btnAutoNext.addEventListener('click', e => {
                bot.toggleAutoNext();
            });

            this.templates = document.createElement('div');
            this.templates.classList.add('bot--templates');
            this.select = document.createElement('select');

            const optionsArr = ['NONE','increment', 'waves'];
            for(let i=0; i<optionsArr.length; i++){
                const opt = document.createElement('option');

                opt.appendChild(document.createTextNode(optionsArr[i]));
                opt.value = optionsArr[i];
                this.select.appendChild(opt);
            }
            this.templates.appendChild(document.createTextNode('Template '));
            this.templates.appendChild(this.select);
            this.select.addEventListener('change', e => {
                bot.text.setTemplate(e.target.value);
            });

            this.listForm = document.createElement('form');
            this.upperDiv = document.createElement('div');

            this.addToList = document.createElement('input');
            this.addToList.placeholder = 'Add to message queue';
            this.addToList.setAttribute('style',`
                width: 70%;
            `);

            this.removeQueueBtn = document.createElement('div');
            this.removeQueueBtn.textContent = 'X';
            this.removeQueueBtn.classList.add('bot--btn');
            this.removeQueueBtn.id = 'bot--remove-queue';
            this.removeQueueBtn.addEventListener('click', e => {
                bot.text.removeQueue();
            });

            this.list = document.createElement('div');
            this.list.addEventListener('click', e => {
                bot.text.removeMessage(e.target.dataset.id);
            });
            this.listForm.addEventListener('submit', e => {
                e.preventDefault();
                const msg = this.addToList.value;
                bot.text.addMessage(msg);

                this.addToList.value = '';
            });

            this.upperDiv.setAttribute('style',`
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin: 10px 0 5px;
            `);

            this.upperDiv.appendChild(this.addToList);
            this.upperDiv.appendChild(this.removeQueueBtn);

            this.listForm.appendChild(this.upperDiv);
            this.listForm.appendChild(this.list);

            this.all.appendChild(this.rate);
            this.all.appendChild(this.btnAutoNext);
            this.all.appendChild(this.templates);
            this.all.appendChild(this.listForm);

            this.panel.appendChild(this.hideBtn);
            this.panel.appendChild(this.all);
            
            body.insertBefore(this.panel, body.firstChild);

            this.stylize();
        },

        stylize(){
            const css = `
                #botPanel {
                    color: white;
                }

                .bot--queue-item {
                    padding: 2px;
                    background: #fff9;
                    color: black;
                    border-top: 1px solid #777;
                    max-width: 100%;
                    overflow: auto;
                    cursor: pointer;
                }

                .bot--btn {
                    padding: 5px;
                    background: red;
                    color: white;
                    border: 2px solid white;
                    cursor: pointer;
                }

                #bot--switch {
                    padding: 10px;
                }

                #bot--hide-btn {
                    margin: 0 0 10px;
                }

                #bot--remove-queue {
                    padding: 2px 6px;
                }

                .bot--templates {
                    margin: 10px 0 0 0;
                }
            `;

            const style = document.createElement('style');

            style.id = 'botStyle';

            if (style.styleSheet) {
                style.styleSheet.cssText = css;
            } else {
                style.appendChild(document.createTextNode(css));
            }

            const oldBotStyle = document.querySelector('#botStyle');

            oldBotStyle ? oldBotStyle.remove() : null;

            document.getElementsByTagName('head')[0].appendChild(style);
        }
    },

    text: {
        textArr: ['🎈'],
        input: '',
        counter: 1,
        msgCounter: 1,
        loop: true,
        isReplyMode: false,
        template: null,
        msg: '',

        insert(){
            
            switch(this.template){
                case 'increment': {
                    this.initialMsg = this.textArr[0];
                    this.msg += this.initialMsg;

                    this.input.value = this.msg;
                    
                    this.msgCounter++;
                } break;

                default: {
                    if(this.textArr.length === 1){
                        this.counter = 1;
                        this.input.value += this.textArr[0];

                    } else if(this.textArr.length <= 0) {
                        bot.stop();

                    } else {
                        if(this.counter <= this.textArr.length){
                            this.input.value = this.textArr[this.counter-1];
                            this.counter++;
                            // console.log('added to counter');

                        } else if(!this.loop){
                            this.counter = 1;
                            bot.stop()

                        } else {
                            this.input.value = this.textArr[0];
                            this.counter = 1;
                            // this.input.value += this.textArr[this.textArr.length];
                        }
                    }
                }
            }
        },

        setLoop(state){
            this.loop = state;
        },

        setReply(state){
            this.isReplyMode = state;
        },

        setTemplate(temp){
            if(temp === 'waves'){
                this.textArr = [ "🎈", "🎈🎈", "🎈🎈🎈", "🎈🎈🎈🎈", "🎈🎈🎈🎈🎈", "🎈🎈🎈🎈", "🎈🎈🎈", "🎈🎈", "🎈"];
                this.updateList();
            }
            else if(temp !== 'NONE')
                this.template = temp;
            else
                this.template = null;
            
            this.reset();
        },

        addMessage(msg){
            if(msg){
                this.textArr.push(msg);
                this.updateList();
            }
        },

        removeMessage(id){
            this.textArr.splice(id, 1);
            this.updateList();
        },

        removeQueue(){
            this.textArr = ['🎈'];
            this.updateList();
        },

        updateList(){
            bot.cp.list.innerHTML = '';
            this.textArr.map((item, id) => {
                const msg = document.createTextNode(item);
                const msgNode = document.createElement('div');
                msgNode.dataset.id = id;
                msgNode.appendChild(msg);
                msgNode.classList.add('bot--queue-item');

                bot.cp.list.appendChild(msgNode);
            });

            this.reset();
        },

        reset(){
            this.counter = 1;
            this.msgCounter = 1;
            this.msg = '';
        },

        init(){
            this.input = bot.inp;
        }
    },

    start(){
        this.stop();

        this.cp.btn.style.setProperty('background','green')

        this.botInterval = setInterval( () => {

            if(this.text.isReplyMode){
                try {
                    if(this.log.lastChild.classList.contains('log-stranger')){
                        this.text.insert();
                        this.sendMsg();
                    }
                } catch(err){}
            } else {
                this.text.insert();
                this.sendMsg();
            }
            this.leaveIfDisconnected();
        
        }, this.rate)
 
        this.isRunning = true;
    },
    
    stop(){
        if(this.isRunning){
            this.cp.btn.style.setProperty('background','red')
            clearInterval(this.botInterval);
            this.botInterval = 0;
            this.isRunning = false;
            this.text.reset();
        }
    },

    sendMsg(){
        if(this.btn){
            this.btn.click();
        } else {
            this.inp.dispatchEvent(new Event('focus'));
            this.inp.dispatchEvent(new KeyboardEvent('keypress',{keyCode:13}));
        }
    },

    leaveIfDisconnected(){
        if(this.btn.classList.contains('disabled') && this.isAutoNext){
            this.btnEsc.click();
            this.text.reset();
        }
    },

    toggle(){
        if(this.isRunning){
            this.stop();
        } else {
            this.start();
        }
    },

    changeRate(rate){
        this.rate = rate;
        //console.log(this.cp.rateText);
        this.cp.rateText.innerText = `Send once/${this.rate}ms`;

        if(this.isRunning)
            this.start();
    },

    toggleAutoNext(){
        if(this.isAutoNext){
            this.cp.btnAutoNext.style.setProperty('background','red')
        } else {
            this.cp.btnAutoNext.style.setProperty('background','green')
        }

        this.isAutoNext = !this.isAutoNext;
    },
 
    init(inputQuery, btnQuery = 0, btnEscQuery = 0){
        this.btn = btnQuery ? document.querySelector(btnQuery) : null;
        this.btnEsc = btnEscQuery ? document.querySelector(btnEscQuery) : null;
        this.inp = inputQuery ? document.querySelector(inputQuery) : null;
        this.log = document.querySelector('#log-dynamic');
 
        this.cp.init();
        this.text.init();
        this.text.updateList();
    },
}
 
//6obcy
bot.init('#box-interface-input', 'button.o-any.o-send', 'button.o-any.o-esc');