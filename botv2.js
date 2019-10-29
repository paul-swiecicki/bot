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

        init(){
            const body = document.querySelector('body');

            const oldBotPanel = document.querySelector('#botPanel');
            oldBotPanel ? (oldBotPanel.remove()) : null;
 
            this.panel = document.createElement('div');
            this.panel.id = 'botPanel';
            this.panel.setAttribute('style',`
                padding: 10px;
                z-index: 1000;
                position: absolute;
                display: flex;
                flex-flow: column;
                justify-content: center;
                width: 300px;
            `);

            this.btn = document.createElement('button');
            this.btn.className = 'botSwitch';
            this.btn.appendChild(document.createTextNode('ON/OFF'))
            this.btn.setAttribute('style',`
                padding: 10px;
                background: red;
                color: white;
                border: 2px solid white;
                cursor: pointer;
            `);
            this.btn.addEventListener('click', e => {
                bot.toggle();
            });

            this.rate = document.createElement('div');
            this.rate.setAttribute('style',`
                margin: 10px 0;
                color: white;
            `);
            this.rateText = document.createElement('div');
            this.rateText.appendChild(document.createTextNode(`Send once/${bot.rate}ms`));
            
            this.rateController = document.createElement('input');
            this.rateController.type = 'range';
            this.rateController.min = 1;
            this.rateController.max = 1000;
            this.rateController.value = 1000;
            this.rateController.step = 10;
            this.rateController.addEventListener('change', e => {
                let rate = e.target.value;
                bot.changeRate(rate);
            });
            this.rateController.setAttribute('style',`
                cursor: pointer;
            `);

            this.rate.appendChild(this.rateText);
            this.rate.appendChild(this.rateController);

            this.btnAutoNext = document.createElement('button');
            this.btnAutoNext.className = 'botSwitch';
            this.btnAutoNext.appendChild(document.createTextNode('Auto Next'))
            this.btnAutoNext.setAttribute('style',`
                padding: 2px;
                background: red;
                color: white;
                border: 2px solid white;
                cursor: pointer;
            `);
            this.btnAutoNext.addEventListener('click', e => {
                bot.toggleAutoNext();
            });

            this.listForm = document.createElement('form');
            this.addToListText = document.createTextNode('Add to message queue');
            this.addToList = document.createElement('input');
            this.addToList.placeholder = 'Add to message queue';
            this.addToList.setAttribute('style',`
                width: 80%;
                margin: 5px 0;
            `);
            this.list = document.createElement('div');
            this.list.addEventListener('click', e => {
                console.log(e.target.textContent);
                
                bot.text.removeMessage(e.target.textContent);
            });

            this.listForm.addEventListener('submit', e => {
                e.preventDefault();
                const msg = this.addToList.value;
                bot.text.addMessage(msg);

                this.addToList.value = '';
            });

            this.listForm.appendChild(this.addToList);
            this.listForm.appendChild(this.list);

            this.panel.appendChild(this.btn);
            this.panel.appendChild(this.rate);
            this.panel.appendChild(this.btnAutoNext);
            this.panel.appendChild(this.addToListText);
            this.panel.appendChild(this.listForm);
            
            body.insertBefore(this.panel, body.firstChild);
        },
    },

    text: {
        textArr: ['🎈'],
        input: '',
        counter: 1,
        finishWhenRunOut: true,

        insert(){
            this.input = bot.inp;

            if(this.textArr.length === 1){
                this.counter = 1;
                this.input.value += this.textArr[0];

            } else {
                if(this.counter <= this.textArr.length){
                    this.input.value = this.textArr[this.counter-1];
                    this.counter++;

                } else if(this.finishWhenRunOut){
                    this.counter = 1;
                    bot.stop()

                } else {
                    this.counter = 1;
                    this.input.value += this.textArr[this.textArr.length];
                }
            }
        },

        addMessage(msg){
            if(msg){
                this.textArr.push(msg);
                this.updateList();
            }
        },

        removeMessage(msg){
            const newTextArr = this.textArr.filter(item => item != msg);
            this.textArr = newTextArr;

            this.updateList();
        },

        updateList(){
            bot.cp.list.innerHTML = '';
            this.textArr.map(item => {
                const msg = document.createTextNode(item);
                const msgNode = document.createElement('div');
                msgNode.appendChild(msg);
                msgNode.setAttribute('style',`
                    padding: 2px;
                    background: #fff;
                    color: black;
                    border-top: 1px solid #aaa;
                    max-width: 100%;
                    overflow: auto;
                    cursor: pointer;
                `);

                bot.cp.list.appendChild(msgNode);
            });
        }
    },

    start(){
        this.stop();

        this.cp.btn.style.setProperty('background','green')

        this.botInterval = setInterval( () => {

            this.text.insert();

            if(this.btn){
                this.btn.click();
            } else {
                this.inp.dispatchEvent(new Event('focus'));
                this.inp.dispatchEvent(new KeyboardEvent('keypress',{keyCode:13}));
            }

            if(this.btn.classList.contains('disabled') && this.isAutoNext)
                this.btnEsc.click();
        
        }, this.rate)
 
        this.isRunning = true;
    },
    
    stop(){
        if(this.isRunning){
            this.cp.btn.style.setProperty('background','red')
            clearInterval(this.botInterval);
            this.botInterval = 0;
            this.isRunning = false;
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
 
        this.cp.init();
        this.text.updateList();
    },
}
 
//6obcy
bot.init('#box-interface-input', 'button.o-any.o-send', 'button.o-any.o-esc');