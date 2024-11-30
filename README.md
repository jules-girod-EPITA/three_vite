Les modifications du README pour ce deuxième rendu sont affichées **en gras**.

# Description du Projet

Vous êtes un médecin qui doit se rendre à l'hopital pour sauver des vies mais pas de chance votre ambulance s'est crashée parce que le conducteur n'a vu que trop tard que la route était en travaux.
Pour cela, vous devez traverser des routes très fréquentées. Faites attention aux voitures, aux arbres et surtout aux pierres !! 

**Atteignez l'hopital pour gagner.**

## Mode d'Emploi
### Installation
Pour utiliser ce projet, suivez les étapes ci-dessous, testé avec node 20.11.1 :

1. Clonez le dépôt et naviguez dans le dossier `three_vite` (racine) :
    ```sh
    git clone <URL_DU_DEPOT>
    cd three_vite
    ```

2. Installez les dépendances :
    ```sh
    npm install
    ```

3. Pour construire le projet pour la production, exécutez :
    ```sh
    npm run build
    ```

4. Pour prévisualiser le projet construit, exécutez :
    ```sh
    npm run preview
    ```

5. Pour lancer l'environnement de développement, exécutez :
    ```sh
    npm run dev
    ```
   
### Jouer
- **Swipez pour déplacer le joueur.**
- Evitez les voitures, les arbres, **et les animaux**.
- Atteignez la fin de la carte pour gagner **(il n'y a plus de fin)**.
- La génération de la carte se fait uniquement au chargement de la page web.


### Ajouts depuis la dernière soumission
- **Ajout du son de voiture**
- **Ajout du son de klaxon des voitures quand on est sur leur trajectoire**
- **Ajout d'animaux au debut, ils possèdent des animations**

### Remarques
- **Le jeu est jouable en AR sur téléphone en vertical uniquement.**
- **Nous n'avons pas eu le temps de faire la synchronisation des mouvements du joueur en AR, donc pour jouer, il faut rester statique et bouger uniquement la tête.**
- **Quand vous mourrez, vous devez attendre 3 secondes avant de pouvoir rejouer. Pour rejouer, il suffit de cliquer sur l'écran**
- **Pour pouvoir faire tourner le jeu sur téléphone en AR, nous avons dû utiliser des InstancedMesh pour chaque modèle 3D différents. Ce qui a pour conséquence de rendre le code plus complexe et moins lisible.**
- **Nous avons abandonné l'idée d'avoir une version compatible avec la version web et la version AR, car cela rendait le code trop complexe.**
- **Pour une meilleure fluidité, on instancie la carte directement au chargement de la page et pas uniquement quand l'utilisateur clique sur "Play" car sinon il y a une latence d'une dizaine de secondes. Par conséquence si on quitte le mode AR les éléments sont toujours calculés**
- **Seul l'un de nous deux possède un téléphone compatible en AR et le téléphone étant ancien, on atteint difficilement les 20-30 FPS (on a même dû downgrade la version de chrome sinon l'application se lançait une fois sur 5).**
- **Nous avons retiré les gros modèles 3D comme la zone de depart et zone de fin pour gagner en performance.**




## Illustration
### Vidéo / GIF / Screenshot
![Exemple du projet en action](./crossy_example.gif)

## Lien pour Tester l'App en Live
[Tester l'application en live]( https://jules-girod-epita.github.io/three_vite/ )

## Nom des Membres du Groupe
### Répartition des Rôles
- **kevin.tran** : Système de mouvement et de collision
- **jules.girod** : Le reste, mais en accord avec kevin.tran étant donné que nous avions d'autres projets en parallèle.

## Sources d'Inspiration
- [Crossy Road](https://crossyroad.com/)
- [Modèle du joueur et décoration](https://poly.pizza/bundle/Cube-World-Kit-DwDr8493Fw)
- [Ambulance](https://poly.pizza/m/8NOFImgkI5N)
- [Voitures](https://sketchfab.com/3d-models/low-poly-vehicle-mini-pack-8-52ee24ff6eb2479891fe68e6ce46af28)
- [Voiture de sport](https://sketchfab.com/3d-models/racing-car-f209f3702fc04371806054e43c496c3a)
- [Hopital](https://sketchfab.com/3d-models/low-poly-hospital-738972de7752491382457c068ab0a6ac)
- [Ville](https://sketchfab.com/3d-models/free-low-poly-simple-urban-city-3d-asset-pack-310c806355814c3794f5e3022b38db85)
- [Route](https://poly.pizza/bundle/Post-Apocolypse-Pack-jg0We8Clu0)
- [Template de projet Vite](https://github.com/fdoganis/three_vite)
- **[Swipe avec Hammerjs](https://hammerjs.github.io/)**