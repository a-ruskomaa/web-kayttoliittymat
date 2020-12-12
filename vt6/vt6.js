"use strict";

console.log(data);

// datarakenteen kopioiminen
function kopioi_kilpailu(data) {
  let kilpailu = new Object();
  kilpailu.nimi = data.nimi;
  kilpailu.loppuaika = data.loppuaika;
  kilpailu.alkuaika = data.alkuaika;
  kilpailu.kesto = data.kesto;
  kilpailu.leimaustavat = Array.from(data.leimaustavat);
  function kopioi_rastit(j) {
    let uusir = {};
    uusir.id = j.id;
    uusir.koodi = j.koodi;
    uusir.lat = j.lat;
    uusir.lon = j.lon;
    return uusir;
  }
  kilpailu.rastit = Array.from(data.rastit, kopioi_rastit);
  function kopioi_sarjat(j) {
    let uusir = {};
    uusir.id = j.id;
    uusir.nimi = j.nimi;
    uusir.kesto = j.kesto;
    uusir.loppuaika = j.loppuaika;
    uusir.alkuaika = j.alkuaika;
    return uusir;
  }
  kilpailu.sarjat = Array.from(data.sarjat, kopioi_sarjat);
  function kopioi_joukkue(j) {
    let uusij = {};
    uusij.nimi = j.nimi;
    uusij.id = j.id;
    uusij.sarja = j.sarja;

    uusij["jasenet"] = Array.from(j["jasenet"]);
    function kopioi_leimaukset(j) {
      let uusir = {};
      uusir.aika = j.aika;
      uusir.rasti = j.rasti;
      return uusir;
    }
    uusij["rastit"] = Array.from(j["rastit"], kopioi_leimaukset);
    uusij["leimaustapa"] = Array.from(j["leimaustapa"]);
    return uusij;
  }

  kilpailu.joukkueet = Array.from(data.joukkueet, kopioi_joukkue);

  return kilpailu;
}

// tällä funktiolla voi kokeilla tyhjätä alkuperäistä dataa ja varmistaa, että
// kopiointi on tehty varmasti oikein
function tyhjenna() {
  // tuhotaan vielä alkuperäisestä tietorakenteesta rastit ja joukkueet niin
  // varmistuuu, että kopiointi on onnistunut
  // ihan jokaista ominaisuutta ei poisteta, mutta oleellisimmat, että
  // varmasti huomaa, jos kopiointi oli tehty väärin
  for (let i in data.rastit) {
    delete data.rastit[i].koodi;
    delete data.rastit[i].lat;
    delete data.rastit[i].lon;
    delete data.rastit[i];
  }

  for (let i in data.sarjat) {

    delete data.sarjat[i].id;
    delete data.sarjat[i];
  }

  for (let i in data.joukkueet) {
    for (let j of data.joukkueet[i].rastit) {
      delete j.aika;
      delete j.rasti;
    }
    delete data.joukkueet[i].nimi;
    delete data.joukkueet[i];
  }
  delete data.rastit;
  delete data.sarjat;
  delete data.joukkueet;
  delete data.leimaustavat;
}

/** Metodi tekee argumenttina annetusta objektista syväkopion,
 * eli palauttaa objektin jonka kaikki attribuutit on rekursiivisesti
 * kopioitu eikä palautettava objekti sisällä muistiviitteitä alkuperäisen
 * objektin sisältöön.
 * 
 * @param {object}
 * @returns {object}
 */
function teeSyvaKopio(object) {
  let newObject = Object.create(Object.getPrototypeOf(object));
  Object.getOwnPropertyNames(object).forEach(prop => {
    if (typeof prop === "object") {
      newObject[prop] = teeSyvaKopio(prop);
    } else {
      newObject[prop] = object[prop];
    }
  });
  return newObject;
}



class App extends React.PureComponent {
  constructor(props) {
    super(props);
    // Käytetään samaa tietorakennetta kuin viikkotehtävässä 1
    // Alustetaan (kopioidaan) tämän komponentin tilaan kopio datan sisällöstä.
    // Tee tehtävässä vaaditut lisäykset ja muutokset tämän komponentin tilaan
    // Kopioiminen on tehtävä seuraavalla tavalla, että saadaan oikeasti aikaan 
    // kopio eikä vain viittausta samaan tietorakenteeseen. 
    // Objekteja ja taulukoita ei voida kopioida pelkällä sijoitusoperaattorilla
    // päivitettäessä React-komponentin tilaa on aina vanha tila kopioitava uudeksi vastaavalla tavalla
    // kts. https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from

    const kilpailu = kopioi_kilpailu(data);

    this.lahtoRasti = kilpailu.rastit.filter(r => r.koodi === "LAHTO")[0];
    this.maaliRasti = kilpailu.rastit.filter(r => r.koodi === "MAALI")[0];

    let rastiMap = new Map();

    kilpailu.rastit.forEach(rasti => rastiMap.set(rasti.id, rasti));

    //siivotaan etukäteen rastileimauksista pois virheelliset leimaukset
    kilpailu.joukkueet.forEach(joukkue => joukkue.rastit = this.siivoaLeimaukset(joukkue, rastiMap));

    //valitaan oletuksena 8h sarja
    const oletusSarja = kilpailu.sarjat[2].id;

    const oletusJoukkue = {
      nimi: "",
      id: -1,
      leimaustapa: [],
      sarja: oletusSarja,
      jasenet: ["", ""],
      rastit: [],
    }

    this.oletusJoukkue = oletusJoukkue;

    this.state = {
      "nimi": kilpailu.nimi,
      "alkuaika": kilpailu.alkuaika,
      "loppuaika": kilpailu.loppuaika,
      "joukkueet": kilpailu.joukkueet,
      "leimaustavat": kilpailu.leimaustavat,
      "rastit": kilpailu.rastit,
      "sarjat": kilpailu.sarjat,
      "kesto": kilpailu.kesto,
      valittu: oletusJoukkue
    };
    return;
  }

  /**
  * Hakee joukkueen leimaamien rastien kaikki tiedot.
  * 
  * Funktio siivoaa pois rastit, jotka on leimattu ennen lähtöä tai maaliin
  * tulon jälkeen, sekä rastit joiden tiedot ovat puutteelliset.
  * 
  * Leimaukset palautetaan taulukkona objekteja.
  */
  siivoaLeimaukset = (joukkue, rastiMap) => {
    //palautetaan tyhjä taulukko jos rasteja ei ole määritelty
    if (joukkue.rastit === undefined || joukkue.rastit.length === 0) {
      return new Array(0);
    }

    //luodaan rasteista uusi taulukko, jotta alkuperäistä taulukkoa ei muuteta
    let rastit = Array.from(joukkue.rastit);

    //järjestetään rastit leimauksen mukaiseen järjestykseen
    rastit.sort((a, b) => a.aika - b.aika);

    let lahtoIndex = -1;
    let maaliIndex = -1;
    let rasteja = rastit.length;

    //etsitään viimeisin lähtöleimaus
    for (let i = rasteja - 1; i >= 0; i--) {
      if (rastit[i].rasti == this.lahtoRasti.id) {
        lahtoIndex = i;
        break;
      }
    }

    if (lahtoIndex === -1) {
      //ei lähtöleimausta, ei voida laskea tulosta
      return new Array(0);
    }

    //etsitään ensimmäinen maalileimaus
    for (let i = 0; i < rasteja; i++) {
      if (rastit[i].rasti == this.maaliRasti.id) {
        maaliIndex = i;
        break;
      }
    }

    if (maaliIndex === -1) {
      //ei maalileimausta, ei voida laskea tulosta
      return new Array(0);
    }

    /* jätetään huomioimatta leimaukset, jotka ovat tapahtuneet ennen lähtöleimausta
    tai maalileimauksen jälkeen */
    rastit = rastit.slice(lahtoIndex, maaliIndex + 1)

    //luodaan joukko, jonka avulla poistetaan rasteista duplikaatit
    let rastiSet = new Set();

    let seulotutRastit = new Array(0);

    rasteja = rastit.length;

    for (let i = 0; i < rasteja; i++) {
      let rastiId = rastit[i].rasti;

      //karsitaan pois huono data
      if (rastiId === null || rastiId === "0" || rastiId === undefined) {
        continue;
      }

      if (typeof rastiId !== 'number') {
        rastiId = parseInt(rastiId);
      }

      if (isNaN(rastiId)) {
        continue;
      }

      //karsitaan duplikaatit
      if (rastiSet.has(rastiId)) {
        continue;
      }

      if (rastiMap.get(rastiId) === null) {
        continue;
      }

      //lisätään rastin id joukkoon, jotta rasti käsitellään vain kerran
      rastiSet.add(rastiId);

      seulotutRastit.push({
        id: rastiId,
        aika: rastit[i].aika,
      });
    }

    return seulotutRastit;
  }

  /**
   * Asettaa komponentin tilaan valituksi argumenttina annetun id:n mukaisen joukkeen.
   * Valittu joukkue välitetään propsina LisaaJoukkue-formille.
   * @param {number} id Valitun joukkueen id
   */
  handleValinta = (id) => {
    this.setState((state) => {
      let valittu = state.joukkueet.filter(joukkue => joukkue.id === id);
      return { valittu: valittu[0] }
    });
  }

  /**
   * Tallentaa lomakkeelle syötetyt tiedot tietorakenteeseen.
   * Uudelle joukkueelle annetaan id, joka on yhdellä suurempi kuin edellinen suurin id.
   * Tallennuksen jälkeen asettaa valituksi tyhjän oletusjoukkueen.
   * @param {object} joukkue Tallennettavan joukkueen tiedot
   */
  tallennaJoukkue = (joukkue) => {
    this.setState((state) => {
      const joukkueet = state.joukkueet;
      let uudetJoukkueet;

      if (joukkue.id < 0) {
        joukkue.id = annaSeuraavaId(joukkueet);
        uudetJoukkueet = joukkueet.concat(joukkue);
      } else {
        uudetJoukkueet = joukkueet.filter(j => j.id !== joukkue.id).concat(joukkue);
      }

      //vaihdetaan oletusjoukkueen id, jotta muutos valuu myös lapsikomponentille
      let valittu = teeSyvaKopio(this.oletusJoukkue);
      valittu.id = state.valittu.id - 1;

      return {
        joukkueet: uudetJoukkueet,
        valittu: valittu
      }
    });

    function annaSeuraavaId(joukkueet) {
      let idt = joukkueet.map(j => j = j.id);
      let maxId = Math.max(...idt);
      return maxId + 1;
    }
  }


  /**
   * Tallentaa rastiin tehdyt muokkaukset tietorakenteeseen.
   * @param {object} rasti Tallennettavan rastin tiedot
   */
  tallennaRasti = (rasti) => {
    this.setState((state) => {
      let uudetRastit = teeSyvaKopio(state.rastit);

      let index = uudetRastit.findIndex(r => r.id === rasti.id);

      uudetRastit[index] = rasti;

      return { rastit: uudetRastit }
    });
  }


  render() {
    //lomakkeen renderöintiin tarvittava tieto käytettävissä olevista leimaustavoista ja sarjoista
    const renderoitavaData = {
      kaikkiSarjat: this.state.sarjat,
      kaikkiLeimaustavat: this.state.leimaustavat
    }
    const sortedJoukkueet = Array.from(this.state.joukkueet).sort((a, b) => a.nimi.localeCompare(b.nimi));
    const sortedRastit = Array.from(this.state.rastit).sort((a, b) => a.koodi.localeCompare(b.koodi));
    return (
      <div className="container">
        <LisaaJoukkue valittu={this.state.valittu} renderoitavaData={renderoitavaData} tallennaJoukkue={this.tallennaJoukkue} />
        <ListaaJoukkueet joukkueet={sortedJoukkueet} kaikkiSarjat={this.state.sarjat} rastit={sortedRastit} handleValinta={this.handleValinta} />
        <ListaaRastit rastit={sortedRastit} tallennaRasti={this.tallennaRasti} />
      </div>);
  }
}

/**
 * Komponentti, joka huolehtii joukkueen tietojen muokkaamiseen käytettävän lomakkeen
 * renderöimisestä sekä tilan ylläpitämisestä.
 */
class LisaaJoukkue extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      minJasenet: false,
      minLeimaustapa: false
    }
  }


  /*jos vanhempielementin tilaa muutetaan valitsemalla uusi joukkue muokattavaksi,
    päivitetään lomakkeen tila vastaamaan valitun joukkueen tietoja */
  static getDerivedStateFromProps(nextProps, prevState) {
    if (nextProps.valittu.id !== prevState.id) {

      let valittu = nextProps.valittu;

      let jasenet = valittu.jasenet;

      if (valittu.jasenet.filter(j => j === "").length === 0) {
        jasenet = jasenet.concat("");
      }

      return {
        nimi: valittu.nimi,
        id: valittu.id,
        leimaustapa: valittu.leimaustapa,
        sarja: valittu.sarja,
        jasenet: jasenet,
        rastit: valittu.rastit,
        minLeimaustapa: (valittu.leimaustapa.length > 0),
        minJasenet: (jasenet.length > 2)
      }
    }

    return null;
  }


  /**
   * Tapahtumankäsittelijä, jota kutsutaan kun joukkueen "perustietoja" muokataan.
   * Huolehtii nimen, leimaustavan sekä sarjan muutoksista.
   * @param {Event} event
   */
  handlePerustiedotChange = (event) => {

    const target = event.target;
    const name = target.name;
    const value = target.value;

    this.setState((state) => {
      if (name === "leimaustapa") {
        let leimaustapa = state.leimaustapa;
        //poistetaan tai lisätään arvo taulukosta riippuen tapahtumasta
        target.checked ?
          leimaustapa = leimaustapa.concat(value) :
          leimaustapa = leimaustapa.filter(val => val !== value);
        return {
          leimaustapa: leimaustapa,
          /* Päivitetään tilaan myös tieto siitä onko joku leimaustapa valittuna.
          Tämä tieto välitetään propseina lapsikomponentille joka huolehtii kenttien
          validoinnista */
          minLeimaustapa: (leimaustapa.length > 0)
        };
      }
      else {
        return { [name]: value };
      }
    });
  }
  /**
   * Tapahtumankäsittelijä, jota kutsutaan kun joukkueen jäsenten tietoja muokataan.
   * Huolehtii nimen, leimaustavan sekä sarjan muutoksista.
   * @param {Event} event 
   */
  handleJasenChange = (index, event) => {
    this.setState((state) => {
      const target = event.target;
      const value = target.value;

      let jasenet = Array.from(state.jasenet);
      //päivitetään arvo taulukkoon
      jasenet[index] = target.value;

      //lasketaan tyhjät
      let tyhjia = jasenet.filter(jasen => jasen === "").length;

      //jos kenttä tyhjennettiin, poistetaan tarvittaessa tarpeeton tyhjä kenttä
      if (value === "") {
        if (tyhjia === 2 && jasenet.length > 2) {
          jasenet = jasenet.filter((jasen, i) => jasen !== "" || i === index);
        }
      } else {
        //jos tyhjiä kenttiä ei ole, lisätään uusi
        if (tyhjia === 0 && jasenet.length < 5) {
          jasenet = jasenet.concat("");
        }
      }

      return {
        jasenet: jasenet,
        /* Päivitetään tilaan myös tieto siitä onko rittävästi jäseniä syötettynä.
        Tämä tieto välitetään propseina lapsikomponentille joka huolehtii kenttien
        validoinnista */
        minJasenet: (jasenet.length > 2)
      }
    });
  }

  /**
   * Tapahtumankäsittelijä, jota kutsutaan kun lomake lähetetään. Tarkistaa onko
   * lomake validoitu ja kutsuu vanhempikomponentin tallennaJoukkue()-funktiota
   * lomakkeen tiedoista koostetulla joukkue-objektilla.
   * @param {Event} event 
   */
  handleSubmit = (event) => {
    event.preventDefault();
    if (event.target.reportValidity()) {

      let joukkue = {
        id: this.state.id,
        nimi: this.state.nimi,
        jasenet: this.state.jasenet.filter(j => j !== ""),
        leimaustapa: this.state.leimaustapa,
        sarja: this.state.sarja,
        rastit: this.state.rastit
      };

      this.props.tallennaJoukkue(teeSyvaKopio(joukkue));
    }
  }

  render() {
    const perustiedot = { nimi: this.state.nimi, leimaustapa: this.state.leimaustapa, sarja: this.state.sarja };
    const renderoitavaData = this.props.renderoitavaData;
    const jasenet = this.state.jasenet;
    const minJasenet = this.state.minJasenet;
    const minLeimaustapa = this.state.minLeimaustapa;

    return (
      <div className="left">
        <form onSubmit={this.handleSubmit} noValidate>
          <Perustiedot valittu={this.props.valittu} minLeimaustapa={minLeimaustapa} perustiedot={perustiedot} renderoitavaData={renderoitavaData} handleChange={this.handlePerustiedotChange} />
          <Jasenet valittu={this.props.valittu} minJasenet={minJasenet} jasenet={jasenet} handleJasenChange={this.handleJasenChange} />
          <button>Tallenna</button>
        </form>
      </div>);
  }
}

/**
 * Komponentti, joka vastaa lomakkeen nimen, leimaustavan ja sarjan valintaan
 * käytetyn fieldsetin luomisesta.
 */
class Perustiedot extends React.PureComponent {
  constructor(props) {
    super(props);
  }

  render() {
    const { nimi, leimaustapa, sarja } = this.props.perustiedot;
    const { kaikkiSarjat, kaikkiLeimaustavat } = this.props.renderoitavaData
    const handleChange = this.props.handleChange;
    const minLeimaustapa = this.props.minLeimaustapa;
    return (
      <fieldset>
        <legend>Joukkueen tiedot</legend>
        <NimiInput value={nimi} handleChange={handleChange} />
        <Leimaustavat selected={leimaustapa} minLeimaustapa={minLeimaustapa} kaikkiLeimaustavat={kaikkiLeimaustavat} handleChange={handleChange} />
        <SarjaInput value={sarja} kaikkiSarjat={kaikkiSarjat} handleChange={handleChange} />
      </fieldset>);
  }
}

/**
 * Komponentti, joka vastaa nimen syöttämiseen käytetyn kentän luomisesta.
 */
class NimiInput extends React.PureComponent {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="container container-center">
        <label htmlFor="nimi-input" className="item-label">Nimi</label>
        <input
          id="nimi-input"
          name="nimi"
          value={this.props.value}
          type="text"
          className="item-field"
          required="required"
          onChange={this.props.handleChange}
        />
      </div>
    )
  }
}

/**
 * Komponentti, joka vastaa leimaustapojen valintaan käytettyjen elementtien luomisesta
 */
class Leimaustavat extends React.PureComponent {
  constructor(props) {
    super(props);
  }

  render() {
    const selected = this.props.selected;
    const handleChange = this.props.handleChange;
    const minLeimaustapa = this.props.minLeimaustapa;
    return (
      <div className="container">
        <p className="item-label">Leimaustapa</p>
        <div className="item-field align-right">
          {this.props.kaikkiLeimaustavat.map((tapa) => {
            const isChecked = selected.indexOf(tapa) !== -1;
            return <LeimaustapaInput key={tapa} tapa={tapa} minLeimaustapa={minLeimaustapa} isChecked={isChecked} handleChange={handleChange} />;
          }
          )}
        </div>
      </div>)
  }
}

/**
 * Komponentti, joka vastaa yksittäisen leimaustavan valitsemiseen käytetyn elementin
 * luomisesta. Komponentin tilaa ylläpidetään vanhempikomponentissa.
 * 
 * Komponentti saa propsina tiedon siitä, onko riittävä määrä leimaustapoja valittuna.
 */
class LeimaustapaInput extends React.PureComponent {
  constructor(props) {
    super(props);
    /* Tässä on käytetty ref-ominaisuutta, jonka avulla komponentti huolehtii
    * autonomisesti elementin validoimisesta ilman tarvetta ylläpitää vanhempikomponentissa
    * erillistä tietorakennetta input-elementeistä.
    * 
    * Jos validointi hoidettaisiin vanhempikomponentissa tapahtumankäsittelijässä, olisi
    * ongelmana mm. tilanne jossa käyttäjä yrittää lähettää lomakkeen tekemättä kenttiin
    * muutoksia. Tällä menetelmällä saadaan myös invalidoitua kaikki syöttökentät, eikä
    * vain viimeisimpänä muokattua.
    * 
    * Ref:iä ei käytetä komponentin ulkopuolella, joten enkapsuloinnin rikkoutumisesta
    * ei muodostu ongelmaa. */
    this.input = React.createRef();
  }

  componentDidMount() {
    const node = this.input.current;
    this.validate(node);
  }

  componentDidUpdate() {
    const node = this.input.current;
    this.validate(node);
  }

  /**
   * Tarkistaa komponentin muodostaman dom-elementin validiteetin.
   * @param {HTMLInputElement} node 
   */
  validate = (node) => {
    if (!this.props.minLeimaustapa && !node.checked) {
      node.setCustomValidity("Anna vähintään yksi leimaustapa!");
    } else {
      node.setCustomValidity("");
    }
  }

  render() {
    const tapa = this.props.tapa;
    return (<div>
      <label>{tapa}
        <input
          name="leimaustapa"
          type="checkbox"
          ref={this.input}
          value={tapa}
          checked={this.props.isChecked}
          onChange={this.props.handleChange} />
      </label>
    </div>)
  }
}

/**
 * Komponentti, joka vastaa sarjan valintaan käytettävien input-elementtien luomisesta.
 * Komponentin tilaa ylläpidetään vanhempikomponentissa.
 */
class SarjaInput extends React.PureComponent {
  constructor(props) {
    super(props);
  }

  render() {
    const sarjat = Array.from(this.props.kaikkiSarjat).sort((a,b) => a.nimi.localeCompare(b.nimi))
    return (
      <div className="container">
        <p className="item-label">Sarja</p>
        <div className="item-field align-right">
          {sarjat.map((sarja) =>
            <div key={sarja.id}>
              <label>{sarja.nimi}
                <input
                  name="sarja"
                  type="radio"
                  value={sarja.id}
                  checked={+this.props.value === sarja.id}
                  required="required"
                  onChange={this.props.handleChange} />
              </label>
            </div>
          )}
        </div>
      </div>
    )
  }
}

/**
 * Komponentti, joka vastaa jäsenten syöttämiseen käytettyjen kenttien luomisesta.
 * Komponentin tilaa ylläpidetään vanhempikomponentissa.
 */
class Jasenet extends React.PureComponent {
  constructor(props) {
    super(props);
  }

  render() {
    const minJasenet = this.props.minJasenet;
    const jasenet = this.props.jasenet;
    return (
      <fieldset>
        <legend>Jäsenet</legend>
        <ul className="jasenlist">
          {jasenet.map((jasen, index) => {
            return (<JasenInput
              value={jasen}
              minJasenet={minJasenet}
              kaikkiJasenet={this.props.jasenet}
              index={index} key={index}
              handleJasenChange={this.props.handleJasenChange} />)
          }
          )}
        </ul>
      </fieldset>
    )
  }
}

/**
 * Komponentti, joka vastaa yksittäisen jäsenen syöttämiseen käytetyn kentän luomisesta.
 * 
 * Komponentin tilaa ylläpidetään vanhempikomponentissa. Komponentti saa propsina tiedon siitä, onko
 * riittävä määrä jäseniä syötettynä.
 */
class JasenInput extends React.PureComponent {
  constructor(props) {
    super(props);
    /* Komponentissa hyödynnetään React:n ref-ominaisuutta, jonka avulla komponentti kykenee
    * autonomisesti huolehtimaan input-elementin validoimisesta. Näin vältytään tarpeettoman
    * logiikan ja erillisen tietorakenteen luomisesta vanhempikomponenttiin.
    * 
    * Jos elementin validointi toteutettaisiin ainoastaan onChange-tapahtumankäsittelijässä,
    * muodostuisi ongelmaksi tilanne jossa käyttäjä yrittää lähettää lomakkeen tekemättä
    * jäsenkenttiin muutoksia. Required-attribuutin käyttäminen ei toimisi tilanteessa,
    * jossa vaikkapa ensimmäinen syöttökenttä on tyhjä ja toiseen ja kolmanteen on syötetty
    * jäsenen tiedot.
    * 
    * Ref:iä ei käytetä komponentin ulkopuolella, joten enkapsuloinnin rikkoutumisesta
    * ei muodostu ongelmaa. */
    this.textInput = React.createRef();
  }

  componentDidMount() {
    this.validate();
  }

  componentDidUpdate() {
    this.validate();
  }

  validate = () => {
    const node = this.textInput.current;
    if (!this.props.minJasenet && node.value === "") {
      node.setCustomValidity("Syötä vähintään kaksi jäsentä!");
    } else if (this.props.kaikkiJasenet.filter(j => j === node.value).length > 1) {
      node.setCustomValidity("Useammalla jäsenellä ei voi olla sama nimi");
      node.reportValidity();
    } else {
      node.setCustomValidity("");
    }
  }

  render() {
    return (
      <li className="container container-center">
        <label className="item-label" htmlFor={"jasen" + (this.props.index + 1)}>Jäsen {this.props.index + 1}</label>
        <input
          id={"jasen" + (this.props.index + 1)}
          type="text"
          name="jasenet"
          ref={this.textInput}
          className="item-field"
          value={this.props.value}
          onChange={(e) => {
            e.persist();
            this.props.handleJasenChange(this.props.index, e)
          }} />
      </li>
    )
  }
}

/**
 * Komponentti, joka vastaa joukkueiden tietojen listaamisesta. Komponentti ei sisällä
 * tilaa. Komponentti sisältää apufunktiot joukkueen kulkeman matkan sekä pisteiden
 * laskemiseksi joukkueen rastileimausten perusteella. Rastileimauksista on siivottava
 * etukäteen pois virheelliset leimaukset.
 */
class ListaaJoukkueet extends React.PureComponent {
  constructor(props) {
    super(props);
  }

  /** 
   * Laskee joukkueen saamat pisteet leimattujen rastien perusteella.
   */
  laskePisteet = (leimaukset, rastiMap) => {
    //lasketaan pisteet vain, jos joukkueella on leimattuja rasteja
    if (leimaukset === undefined || leimaukset.length === 0) {
      return 0;
    }

    //lasketaan rastien pisteiden yhteissumma
    let summa = 0;


    leimaukset.forEach(rasti => {
      summa += this._annaRastinPisteet(rasti.id, rastiMap);
    });

    return summa;

  }

  /**
   * Antaa rastin pisteet rastikoodin ensimmäisen merkin perusteella.
   * Palauttaa 0 jos ensimmäinen merkki ei ole numero.
   */
  _annaRastinPisteet = (rastiId, rastiMap) => {
    let rasti = rastiMap.get(rastiId);

    let pisteet = parseInt(rasti.koodi[0]);

    if (isNaN(pisteet)) {
      return 0;
    }

    return pisteet;
  }

  /**
  * Laskee reitillä kuljetun matkan. Argumenttina annetaan leimattujen rastien tiedot sisältävä
  * taulukko järjestettynä leimausaikojen mukaisesti.
  */
  laskeMatka = (leimaukset, rastiMap) => {
    let matka = 0;

    //lasketaan vain jos leimattuja rasteja
    if (leimaukset === undefined || leimaukset.length === 0) {
      return 0;
    }

    //lasketaan kuljettu matka rasti kerrallaan
    for (let i = 0; i < leimaukset.length - 1; i++) {
      let nykyinen = rastiMap.get(leimaukset[i].id);

      let seuraava = rastiMap.get(leimaukset[i + 1].id);

      //lisätään kuljettuun matkaan matka nykyiseltä rastilta seuraavalle
      matka += getDistanceFromLatLonInKm(nykyinen.lat, nykyinen.lon, seuraava.lat, seuraava.lon);
    }

    function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
      var R = 6371; // Radius of the earth in km
      var dLat = deg2rad(lat2 - lat1);  // deg2rad below
      var dLon = deg2rad(lon2 - lon1);
      var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
        ;
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      var d = R * c; // Distance in km
      return d;
    }

    function deg2rad(deg) {
      return deg * (Math.PI / 180);
    }

    // palautetaan matka yhden desimaalin tarkkuudella
    return matka.toFixed(1);
  }

  render() {
    const rastit = this.props.rastit;
    let rastiMap = new Map();

    //muodostetaan rasteista map matkan sekä laskemisen tehostamiseksi 
    rastit.forEach(rasti => rastiMap.set(rasti.id, rasti));

    const joukkueet = this.props.joukkueet;
    return (
      <div className="center">
        <ul>
          {joukkueet.map(joukkue => {
            const matka = this.laskeMatka(joukkue.rastit, rastiMap);
            const pisteet = this.laskePisteet(joukkue.rastit, rastiMap);
            const sarja = this.props.kaikkiSarjat.filter(sarja => sarja.id == joukkue.sarja)[0].nimi;

            return <Joukkue key={joukkue.id} joukkue={joukkue} sarja={sarja} pisteet={pisteet} matka={matka} handleValinta={this.props.handleValinta} apuFunktiot={this.apuFunktiot} />
          })}
        </ul>
      </div>);
  }
}

/**
 * Komponentti, joka vastaa yksittäisen joukkueen tietojen renderoimisestä.
 */
class Joukkue extends React.PureComponent {
  constructor(props) {
    super(props);
  }

  render() {
    const joukkue = this.props.joukkue;

    return (
      <li>
        <a href="#" onClick={(e) => this.props.handleValinta(joukkue.id, e)}>{joukkue.nimi}</a>
        <span> ({this.props.pisteet} p, {this.props.matka} km)</span>
        <br />
        <span>{this.props.sarja} ({joukkue.leimaustapa.join(",")})</span>
        <ul>
          {joukkue.jasenet.map(jasen => <li key={jasen}>{jasen}</li>)}
        </ul>
      </li>
    )
  }
}

/**
 * Komponentti, jonka avulla muodostetaan listaus kilpailun rasteista.
 */
class ListaaRastit extends React.PureComponent {
  constructor(props) {
    super(props);
  }

  render() {
    const rastit = this.props.rastit;
    const tallennaRasti = this.props.tallennaRasti;
    return (
      <div className="right">
        <ul>
          {rastit.map(rasti =>
            <Rasti
              key={rasti.id}
              rasti={rasti}
              kaikkiRastit={rastit}
              tallennaRasti={tallennaRasti} />
          )}
        </ul>
      </div>)
  }
}

/**
 * Komponentti, joka vastaa yksittäisen rastin tietojen näyttämiseen ja muokkaamiseen
 * käytetävien elementtien luomisesta.
 * 
 * Tilan ylläpito olisi kenties hyvä nostaa vanhempikomponenttiin, mutta en keksinyt
 * keinoa toteuttaa muokattavan komponentin arvojen muuttamista ilman että välitettävien
 * propsien ja if-else-logiikan määrä kävi turhan suureksi.
 */
class Rasti extends React.PureComponent {
  constructor(props) {
    super(props);

    //ref:iä hyödynnetään, jotta saadaan focus siirrettyä rastikoodia klikkaamalla
    //aukeavaan input-kenttään automaattisesti
    this.textInput = React.createRef();

    const rasti = this.props.rasti;

    //alustetaan tila propsin avulla
    this.state = {
      koodi: rasti.koodi,
      lat: rasti.lat,
      lon: rasti.lon,
      editKoodi: false,
      editKoordinaatit: false
    }
  }

  componentDidUpdate(prevProps, prevState) {
    //siirretään focus luotuun kenttään
    const node = this.textInput.current;
    if (node) {
      node.focus();
    }

    //tallennetaan muokkauksia varten alkuperäiset arvot
    this.alkupKoodi = prevProps.rasti.koodi;
    this.alkupLat = prevProps.rasti.lat;
    this.alkupLon = prevProps.rasti.lon;

  }

  /**
   * Tapahtumankäsittelijä, joka huolehtii rastikoodin muokkauskentän päivityksestä
   * sekä validoinnista
   * @param {Event} event 
   */
  handleKoodiChange = (event) => {
    const node = event.target;
    const value = node.value;
    const id = this.props.rasti.id;

    if (isNaN(+value[0])) {
      node.setCustomValidity("Ei ole numero");
    } else if (this.props.kaikkiRastit.findIndex(r => r.koodi === value && r.id !== id) !== -1) {
      node.setCustomValidity("Rastikoodi on jo olemassa");
    } else {
      node.setCustomValidity("");
    }
    node.reportValidity();

    this.setState({ koodi: value });
  }

  /**
   * Tapahtumankäsittelijä, joka huolehtii rastin koordinaattien muokkauskentän päivityksestä
   * @param {Event} event Leaflet JS-kirjaston "move" event
   */
  handleKoordinaatitChange = (event) => {
    let { lat, lng } = event.latlng;

    this.setState({
      lat: lat.toFixed(6),
      lon: lng.toFixed(6)
    });
  }

  /**
   * Tapahtumankäsittelijä, joka mahdollistaa rastikoodin muokkauksen. Komponentti
   * renderöi tekstin tilalle input-elementin mikäli tilan editKoodi-muuttuja on arvoltaan
   * true. Kutsuu rastin tallentavaa funktiota, mikäli rastikoodia on muokattu.
   * @param {Event} event 
   */
  toggleEditKoodi = (event) => {
    this.setState((state) => {
      //poistutaan muokkauksesta vain jos tekstikenttä on validi
      if (state.editKoodi && this.textInput.current.validity.valid) {
        //tallennetaan vain jos koodi muuttunut
        if (state.koodi !== this.alkupKoodi) {
          let rasti = {
            id: this.props.rasti.id,
            koodi: state.koodi,
            lat: state.lat,
            lon: state.lon
          };
          this.tallenna(rasti);
        }

        return { editKoodi: false };

      } else {
        return { editKoodi: true };
      }
    });
  }

  /**
   * Tapahtumankäsittelijä, joka mahdollistaa koordinaattien muokkaamisen. Komponentti
   * renderöi muokkaamisen mahdollistavan elementin, mikäli tilan editKoordinaatit-muuttuja
   * on arvoltaan true.
   * @param {Event} event 
   */
  toggleEditKoordinaatit = (event) => {
    this.setState((state) => {
      if (state.editKoordinaatit) {
        //tallennetaan vain jos rastia on muokattu
        if (state.lat !== this.alkupLat || state.lon !== this.alkupLon) {
          let rasti = {
            id: this.props.rasti.id,
            koodi: state.koodi,
            lat: state.lat,
            lon: state.lon
          };
          this.tallenna(rasti);
        }
        return { editKoordinaatit: false };
      } else {
        return { editKoordinaatit: true };
      }
    });
  }

  /**
   * Kutsuu App-komponentin tallennaRasti-funktiota
   * @param {object} rasti 
   */
  tallenna = (rasti) => {
    this.props.tallennaRasti(rasti);
  }

  render() {
    const koodi = this.state.koodi;
    const lat = this.state.lat;
    const lon = this.state.lon;

    //renderöitävä näkymä riippuu komponentin tilasta
    return (
      <li>
        {this.state.editKoodi ?
          <input ref={this.textInput} type="text" value={koodi} onChange={this.handleKoodiChange} onBlur={this.toggleEditKoodi} onKeyUp={(e) => { if (e.keyCode === 13) this.toggleEditKoodi()}} /> :
          <span onClick={this.toggleEditKoodi}>{koodi}</span>}
        <br />
        <details>
          <summary onClick={this.toggleEditKoordinaatit}>{lat}, {lon}</summary>
          {this.state.editKoordinaatit ?
            <PikkuKartta latlng={[+lat, +lon]} handleKoordinaatitChange={this.handleKoordinaatitChange} toggleEditKoordinaatit={this.toggleEditKoordinaatit} /> :
            null}
        </details>
      </li>
    )
  }
}

/**
 * Komponentti, joka mahdollistaa rastin koordinaattien muokkaamisen Leaflet JS
 * kirjaston kartan avulla.
 */
class PikkuKartta extends React.PureComponent {
  constructor(props) {
    super(props);
    this.mapContainer = React.createRef();
    this.map = null;
  }

  //luodaan kartta kun komponentti lisätään dom-puuhun
  componentDidMount() {
    this.map = this.luoKartta(this.mapContainer.current, this.props.latlng);
  }

  componentWillUnmount() {
    this.map = null;
  }

  /**
   * Luo kilpailun rastien näyttämiseen tarkoitetun Leaflet JS-kartan. Karttapohjana
   * käytetään maanmittauslaitoksen maastokarttaa.
   * @param {number} karttaDiv Kartan vanhempielementti
   */
  luoKartta = (karttaDiv, latlng) => {
    //luodaan kartta ja asetetaan näkymä kattamaan kaikki rastit
    let mymap = new L.map(karttaDiv, {
      crs: L.TileLayer.MML.get3067Proj()
    });

    L.tileLayer.mml_wmts({ layer: "maastokartta" }).addTo(mymap);

    this.luoMarker(latlng).addTo(mymap);

    /* jostain syystä kartta ei (ainakaan huonolla internet-yhteydellä) näytä
     * oikeaa sijaintia jos setView-funktiota kutsutaan välittömästi kartan luomisen
     * jälkeen */
    setTimeout(() => mymap.setView(latlng, 11), 500);

    return mymap;
  }

  /**
   * Luo karttaan markerin, jonka avulla koordinaatteja voi muokata. Kutsuu
   * vanhempikomponentin tapahtumankäsittelijää kun markkeria liikutetaan,
   * jolloin koordinaatit saa päivitettyä näkyviin reaaliajassa.
   * @param {Array} latlng 
   */
  luoMarker = (latlng) => {
    const handleKoordinaatitChange = this.props.handleKoordinaatitChange;

    let marker = L.marker(latlng, { draggable: 'true' });

    marker.addEventListener("move", (e) =>
      handleKoordinaatitChange(e)
    )
    return marker;
  }

  render() {
    return <div
      style={{
        width: "200px",
        height: "200px"
      }}
      ref={this.mapContainer} />
  }
}

ReactDOM.render(
  <App />,
  document.getElementById('root')

);
