# Sen Events

Sen Events est une petite application web en français pour créer des événements et enregistrer des réservations. Elle utilise HTML, CSS et JavaScript avec des classes et des modules ES.

## Lancer le projet

Lance le projet en ouvrant `index.html` avec une extension de serveur local, par exemple **Live Server**. Le projet utilise `type="module"` et fonctionne donc mieux depuis un serveur local que lorsqu'on ouvre directement le fichier dans le navigateur.

## Structure des fichiers

- `index.html` contient la structure de la page, les formulaires de création et de réservation, ainsi que le chargement du JavaScript.
- `style.css` définit le thème sombre, la mise en page des événements et des réservations, et l'affichage responsive.
- `icon.png` est l'icône de l'onglet du navigateur.
- `js/main.js` relie l'interface aux classes : il affiche les événements, gère les formulaires, vérifie les places et affiche les réservations.
- `js/evenement.js` définit la classe `Evenement` et vérifie qu'un nombre de places demandé est disponible.
- `js/utilisateur.js` définit la classe `Utilisateur`.
- `js/reservation.js` définit la classe `Reservation` et calcule le prix total d'une réservation.
- `js/storage.js` valide et sauvegarde les événements et les réservations dans `localStorage`.
- `js/telephone.js` valide et normalise les numéros sénégalais au format international.

## Fonctionnement

1. Clique sur **Créer un événement**, renseigne les champs et publie l'événement.
2. L'image est facultative. Si aucune image n'est fournie (ou si son URL ne charge pas), un message s'affiche à sa place.
3. Clique sur **Réserver** sur une carte, puis renseigne les informations demandées.
4. Le nombre de places demandé doit être un entier positif et ne peut pas dépasser le stock disponible.
5. Le téléphone doit respecter le format d'un numéro mobile sénégalais (70, 75, 76, 77, 78), suivi de 7 chiffres. Le format est vérifié avant l'enregistrement, mais le projet ne vérifie pas que le numéro est attribué ou actif.
6. Après confirmation, la réservation apparaît dans **Mes Réservations** et le stock de l'événement diminue. Le bouton de réservation est désactivé lorsque l'événement est complet.
7. Les réservations s'affichent sur trois colonnes sur grand écran, deux sur écran intermédiaire et une sur petit écran.

## État actuel

- Les événements et les réservations sont sauvegardés dans `localStorage` pour rester cohérents après un rechargement de page.
- La recherche et les filtres par catégorie sont actifs et filtrent selon le titre, le lieu et la catégorie.
- Les événements peuvent être créés, modifiés, supprimés et validés avec des contrôles de doublon et de cohérence catégorie/titre.
