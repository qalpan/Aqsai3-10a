// layout.js - Ортақ интерфейс және логика

document.addEventListener("DOMContentLoaded", function() {
    
    // 1. Оң жақ батырманы бұғаттау (сіздің кодыңыз)
    document.ondragstart = test;
    document.onselectstart = test;
    document.oncontextmenu = test;
    function test(){return false}

    // 2. Жоғарғы жақ (HEADER & MENU) HTML коды
    const headerHTML = `
        <ul class="belgi" href="https://qalpan.github.io/Aqsai3-10a/">
            <img src="sůuretter/jazyu-Aqsai3-10a yi birlestigi.svg" alt="Басты бет" title="Басты бетке - оралыу" data-image="sůuretter/jazyu-Aqsai3-10a yi birlestigi.svg" data-description="бастау">
        </ul>

        <ul class="injener">
            <a><strong>Инженерлік желілерге қызымет</strong></a>
            <a href="tel:+7 700 740 0005">+7 700 740 0005 operator</a>
            <a href="tel:+7 747 921 5140  tel:+7 705 765 1170">+7 747 921 5140  +7 705 765 1170 santex</a>
            <a href="tel:+7 705 765 1170">+7 705 765 1170 santex  electr</a>
            <a><strong>Үи бірлестігі</strong></a>
            <a class="email" href="mailto:aqsai3-10a@groups.outlook.com">sk-joba@outlook.com</a>
            <a href="tel:+7 701 739 8309">+7 701 739 8309</a>
            <a class="skype" href="https://teams.live.com/l/invite/FEATXbIY6Xr_F0bPAE">web - tems (skype)</a>
            <a class="jami" href="https://jami.net">web - jami - aqsai3-10a</a>  
        </ul>

        <ul class="menu">
            <li class="list">
                <a href="https://qalpan.github.io/Aqsai3-10a/">web - site – Aqsai3-10a</a>
            </li>
        </ul>
    `;

    // 3. Төменгі жақ (FOOTER) HTML коды
    const footerHTML = `
        <footer>
            <p>Aqsai3-10a yi birlestigi</p>
        </footer>
    `;

    // 4. HTML-ді бетке кірістіру
    const uniqueContent = document.querySelector('.kөrme');
    
    if (uniqueContent) {
        // .kөrme блогының алдына Хедерді қою
        uniqueContent.insertAdjacentHTML('beforebegin', headerHTML);
        // .kөrme блогының соңына Футерді қою
        uniqueContent.insertAdjacentHTML('afterend', footerHTML);
    }

    // 5. Аккордеон скрипті (Menu logic)
    const list = document.querySelectorAll('.list');
    function accordion(e){
        e.stopPropagation(); 
        if(this.classList.contains('active')){
            this.classList.remove('active');
        }
        else if(this.parentElement.parentElement.classList.contains('active')){
            this.classList.add('active');
        }
        else{
            for(i=0; i < list.length; i++){
            list[i].classList.remove('active');
            }
                this.classList.add('active');
            }
    }
    for(i = 0; i < list.length; i++ ){
        list[i].addEventListener('click', accordion);
    }
});
