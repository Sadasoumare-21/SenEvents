export class Reservation{
    constructor(evenement, utilisateur, nombreDePlaces){
        this.id = Date.now();
        this.eventId = String(evenement.id);
        this.evenement = evenement;
        this.utilisateur = utilisateur;
        this.nombreDePlaces = nombreDePlaces;
    }

    calculerTotalReservation(){
        return this.evenement.prix * this.nombreDePlaces;
    }

}