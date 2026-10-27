

export class Utilisateur{
    constructor(prenom, nom, email, telephone){
        this.id = Date.now();
        this.prenom = prenom;
        this.nom = nom;
        this.email = email;
        this.telephone = telephone;
    }

}