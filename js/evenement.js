export class Evenement{
    constructor(id, titre, categorie, lieu, date, prix, places, description, image){
        this.id = id;
        this.titre = titre;
        this.categorie = categorie;
        this.lieu = lieu;
        this.date = date;
        this.prix = prix;
        this.places = places;
        this.description = description;
        this.image = image;
    }

    verifierDisponibiliteDesPlaces(nombrePlace){
        return Number.isInteger(nombrePlace) && nombrePlace > 0 && nombrePlace <= this.places;
    }
}
