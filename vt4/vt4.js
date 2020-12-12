"use strict";

const SVGNS = 'http://www.w3.org/2000/svg';
const COLORS = ["#ff0000", "#00ff00", "#0000ff", "#ff00ff", "#ffff00", "#00ff00", "#00ffff", "#ffffff"];

/** Luo 10 ruudun pystysivujen välillä seilaavaa, väriä vaihtavaa palkkia. */
function luoHeiluripalkit(maara = 10) {
    for (let i = 0; i < maara; i++) {
        let defs = document.createElementNS(SVGNS, 'defs');
        defs.appendChild(luoGradientti(i, "cyan"));
        let svg = luoSvg(defs);
        svg.setAttribute("class", "heiluripalkki");
        let palkki = luoPalkki(i);
        svg.appendChild(palkki);

        //luodaan palkit 2.5s aikana
        let delay = 2500 / maara;
        svg.style.animationDelay = i * delay + "ms";

        /* disabloidaan turhat rutinat jshintilta, tässä luodaan
        closure joka sitoo käytetyt muuttujat palkkikohtaisesti */
        /*jshint loopfunc: true */
        svg.addEventListener('animationiteration', ((i) => {
            let kierros = 0;
            
            //palautetaan joka palkille tapahtumankäsittelijäksi funktio, joka vaihtaa
            //palkin keskimmäisen gradientin väriä apufunktion avulla
            return function () {
                kierros++;
                let vari = haeVari(kierros);
                let varipalkki = document.getElementById(`gradient_${i}_color`);
                varipalkki.setAttribute("stop-color", vari);
            };
        })(i));

        document.body.appendChild(svg);
    }
}

/** Luo taustalle aaltoilevat palkit. Oletusarvoisesti palkkeja luodaan siten,
 * että yhden animoitavan elementin leveys on 70% ikkunan leveydestä ja korkeus
 * 4px.  */
function luoAaltoilevatPalkit(maaraX = 10, maaraY = window.innerHeight / 4) {
    let defs = document.createElementNS(SVGNS, 'defs');
    defs.appendChild(luoGradientti("aalto", "yellow"));

    /* luodaan ulommassa silmukassa halutun resoluution mukainen määrä
     svg-kuvia ja asemoidaan ne päällekkäin */
    for (let i = 0; i < maaraY; i++) {
        let svg = luoSvg(defs);
        let korkeus = window.innerHeight / maaraY;
        svg.setAttribute("class", "aaltopalkki");
        svg.setAttribute("width", "70%");
        svg.setAttribute("height", `${korkeus}px`);

        svg.style.top = `${i * korkeus}px`;
        svg.style.animationDelay = i * (8000 / maaraY) + "ms";

        let leveys = 100 / maaraX;

        // luodaan sisemmässä silmukassa haluttu määrä rect-elementtejä
        for (let i = 0; i < maaraX; i++) {
            let palkki = luoPalkki("aalto", `${i * leveys}%`, 0, `${leveys}%`, "100%");
            svg.appendChild(palkki);
        }

        document.body.appendChild(svg);
    }
}

/** Luo yksittäisen palkin annetuilla mitoilla sekä samaa id:tä vastaa */
function luoPalkki(id, x = 0, y = 0, width = "100%", height = "100%") {
    let rect = document.createElementNS(SVGNS, "rect");
    rect.setAttribute("x", x);
    rect.setAttribute("y", y);
    rect.setAttribute("width", width);
    rect.setAttribute("height", height);
    rect.setAttribute("fill", `url(#gradient_${id})`);

    return rect;
}

/** Luo tyhjän svg-kuvan. */
function luoSvg(defs) {
    let svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute("xmlns", SVGNS);
    svg.setAttribute("version", "1.1");
    svg.appendChild(defs);

    return svg;
}

/** 
 * Luo gradientin palkien värjäämiseen, molempien reunojen väri on musta, 
 * keskimmäinen väri annetaan argumenttina merkkijonomuodossa.
 */
function luoGradientti(id, color) {
    let gradient = document.createElementNS(SVGNS, "linearGradient");
    gradient.id = "gradient_" + id;

    let stop1 = document.createElementNS(SVGNS, "stop");
    stop1.setAttribute("offset", "0%");
    stop1.setAttribute("stop-color", "black");
    gradient.appendChild(stop1);

    let stop2 = document.createElementNS(SVGNS, "stop");
    stop2.setAttribute("offset", "50%");
    stop2.setAttribute("stop-color", color);
    stop2.id = `gradient_${id}_color`;
    gradient.appendChild(stop2);

    let stop3 = document.createElementNS(SVGNS, "stop");
    stop3.setAttribute("offset", "100%");
    stop3.setAttribute("stop-color", "black");
    gradient.appendChild(stop3);

    return gradient;
}

/** Hakee vakiotaulukosta seuraavan värin. */
function haeVari(kierros) {
    let index = kierros % COLORS.length;
    return COLORS[index];
}

/** Luo neljään osaan jaetun pöllön. */
function luoPollo() {
    let polloImg = document.createElement("img");
    polloImg.src = "http://appro.mit.jyu.fi/cgi-bin/tiea2120/kuva.cgi";
    polloImg.onload = (e) => {
        let width = polloImg.width / 2;
        let height = polloImg.height / 2;
        luoPollonOsa(polloImg, 1, width, height, 0, 0);
        luoPollonOsa(polloImg, 2, width, height, -width, 0);
        luoPollonOsa(polloImg, 3, width, height, 0, -height);
        luoPollonOsa(polloImg, 4, width, height, -width, -height);
    };
}

/** Luo yksittäisen pöllön osan ja lisää sen body:n lapseksi */
function luoPollonOsa(image, i, width, height, translateX, translateY) {
    let canvas = document.createElement("canvas");
    canvas.id = `pollo_Q${i}`;
    canvas.setAttribute("width", width);
    canvas.setAttribute("height", height);
    canvas.className = "pollo";
    let ctx = canvas.getContext("2d");
    ctx.translate(translateX, translateY);

    ctx.drawImage(image, 0, 0);
    document.body.appendChild(canvas);
}

/** Lisää kaksi pingviiniä body:n lapsiksi */
function luoPingut() {
    document.body.appendChild(luoPingu(1));
    document.body.appendChild(luoPingu(2));
}

/** Luo yksittäisen pingviinin div-elementin sisälle */
function luoPingu(numero) {
    let pinguImg = document.createElement("img");
    pinguImg.src = "http://appro.mit.jyu.fi/tiea2120/vt/vt4/penguin.png";
    pinguImg.alt = "pingviini";
    let div = document.createElement("div");
    div.style.display = "inline-block";
    pinguImg.id = `pingu_${numero}`;
    pinguImg.className = "pingu";
    div.appendChild(pinguImg);
    return pinguImg;
}

/**
 * Luo scrollerin joka piirtää argumenttina annetun merkkijonotaulukon
 * alkioita ikkunaan rivi kerrallaan. Toteutettu luomalla canvas-elementti,
 * joka on korkeudeltaan 75px näytön pystyresoluutiota korkeampi.
 * 
 * Canvasta liikutellaan toistuvalla css-animaatiolla alhaalta ylös 45px
 * kerrallaan. Jokaisen kierroksen jälkeen canvas ensin tyhjennetään ja
 * sen jälkeen piirretään näyttöön mahtuva määrä rivejä yksi rivi edellistä
 * kierrosta ylemmäs.
 * 
 * En saanut css:n attr()-funktiota toimimaan firefox:ssa jotta olisin saanut
 * scrollerin fonttikoon määritettyä viewportin leveyden ja rivien pituuden
 * mukaan. Canvaksen liikuttelu prosenttipohjaisesti sai tekstin ilmestymään
 * nykivästi kun ikkunan koko muuttui liian pieneksi. Canvaksen leveydeksi on
 * nyt kovakoodattu 700px ja tekstin korkeudeksi 40px.
 * 
 * Modernilla puhelimella sivu näkyy vaaka-asennossa oikein, mutta pystyasennossa
 * pisimpien rivien sivut leikkautuvat pois.
 */
function luoScroller(teksti) {
    let canvas = document.createElement("canvas");
    canvas.id = `scroller`;
    canvas.className = "textscroller";
    canvas.height = window.screen.height + 75;
    canvas.width = 700;
    let ctx = canvas.getContext("2d");
    let koko = 40;
    ctx.font = `${koko}px Arial`;
    ctx.fillStyle = "white";
    //let rivienLeveydet = teksti.map((rivi) => ctx.measureText(rivi).width);
    //canvas.width = Math.max(...rivienLeveydet) + 50;
    //console.log(canvas.width);

    let rivinKoko = koko + 5;
    let riveja = Math.floor(canvas.height / rivinKoko);

    let kierros = 0;

    /* Teksi piirretään ruudulle siten, että alussa teksti rullaa tyhjään
    ikkunaan, mutta seuraavalla kierroksella viimeisen ja ensimmäisen rivin
    väliin jää vain yksi tyhjä rivi. Lasketaan valmiiksi, minkä rivin tulisi
    olla canvaksen yläreunassa, jotta tekstisisällön ensimmäinen rivi jää
    juuri ruudun alareunan alapuolelle */
    let ekarivi = teksti.length - (Math.floor(riveja)) % teksti.length;

    canvas.addEventListener('animationiteration', () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        /* Tästä nyt tulee hieman turhaa iffittelyä, mutta enpä äkkiseltään
        keksinyt helpompaa tapaa saada tekstiä rullaamaan alussa tyhjälle
        ruudulle, mutta seuraavilla kierroksilla samaan putkeen. Piirretään
        animaation ensimmäisellä kierroksella vain taulukon ensimmäinen rivi
        ikkunan alareunaan, toisella ensimmäinen ja toinen, jne. Myöhemmässä
        vaiheessa piirretään rivit aloittaen ikkunan yläreunasta siten, että
        tekstin loppuessa uusi teksti alkaa heti edellisen kierroksen perään.
        */
        if (kierros < riveja) {
            let alkurivi = 0;
            for (let i = 0; i <= kierros; i++) {
                let rivi = (alkurivi + i) % teksti.length;
                let posY = rivinKoko * (riveja - kierros + i);
                piirraRivi(rivi, posY);
            }
        } else {
            for (let i = 0; i <= riveja; i++) {
                let rivi = (ekarivi + i) % teksti.length;
                let posY = rivinKoko * i;
                piirraRivi(rivi, posY);
            }
        }

        // Seuraavalla kierroksella aloitetaan piirtäminen yhtä riviä edempää
        ekarivi = ++ekarivi % teksti.length;
        kierros++;
    });

    // keskitetään rivit x-akselilla
    function piirraRivi(rivi, posY) {
        let metrics = ctx.measureText(teksti[rivi]);
        let posX = (canvas.width - metrics.width) / 2;
        ctx.fillText(teksti[rivi], posX, posY);
    }

    document.body.appendChild(canvas);
}

/** Pilkkoo annetun tekstin rivinvaihtomerkin kohdalta. Huomioi myös
 * merkkijonomuotoisen "\n" */
function pilkoTeksti(teksti) {
    teksti = teksti.replace(/\"/g, "");
    teksti = teksti.replace(/\\n/g, "\n");
    let tekstiArr = teksti.split("\n");
    tekstiArr.push("");

    for (let rivi of tekstiArr) {
        rivi = rivi.trim();
    }
    return tekstiArr;
}


window.onload = function () {
    //haetaan scrollerin teksti get-pyynnöllä työhakemistosta
    var client = new XMLHttpRequest();
    client.open('GET', './teksti.txt');
    client.onreadystatechange = function () {
        if (client.readyState === XMLHttpRequest.DONE) {
            let teksti = client.responseText;
            teksti = pilkoTeksti(teksti);
            luoScroller(teksti);
        }
    };
    client.send();

    luoPollo();

    luoHeiluripalkit();

    luoPingut();

    luoAaltoilevatPalkit();

    /*piirretään aaltoilevat palkit uusiksi ikkunan koon muuttuessa, jotta skaalaus
    pelittää */
    window.addEventListener("resize", (e) => {
        let vanhat = document.querySelectorAll(".aaltopalkki");

        for (let svg of vanhat) {
            document.body.removeChild(svg);
        }

        luoAaltoilevatPalkit();

    });
};
