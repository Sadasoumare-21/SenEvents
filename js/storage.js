const STORAGE_KEYS = Object.freeze({
    evenements: 'evenements',
    reservations: 'reservations'
});

let generatedIdCounter = 0;

function getStorage() {
    try {
        return window.localStorage;
    } catch (error) {
        return null;
    }
}

function generateUniqueId(prefix, existingIds = []) {
    const ids = new Set(Array.from(existingIds, (id) => String(id)));
    let id;

    do {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            id = `${prefix}-${crypto.randomUUID()}`;
        } else {
            generatedIdCounter += 1;
            id = `${prefix}-${Date.now()}-${generatedIdCounter}-${Math.random().toString(16).slice(2)}`;
        }
    } while (ids.has(id));

    return id;
}

function generateUniqueEventId(existingIds = []) {
    return generateUniqueId('event', existingIds);
}

function normalizeEvent(event) {
    if (!event || typeof event !== 'object') {
        return null;
    }

    const titre = typeof event.titre === 'string' ? event.titre.trim() : '';
    const categorie = typeof event.categorie === 'string' ? event.categorie.trim() : '';
    const lieu = typeof event.lieu === 'string' ? event.lieu.trim() : '';
    const date = typeof event.date === 'string' ? event.date.trim() : '';
    const description = typeof event.description === 'string' ? event.description.trim() : '';
    const image = typeof event.image === 'string' ? event.image.trim() : '';
    const prix = Number(event.prix);
    const places = Number(event.places);
    const id = typeof event.id === 'string' || typeof event.id === 'number'
        ? String(event.id).trim()
        : '';

    if (!titre || !categorie || !lieu || !date || !Number.isFinite(prix) || !Number.isFinite(places)) {
        return null;
    }

    return {
        id: id || generateUniqueEventId(),
        titre,
        categorie,
        lieu,
        date,
        prix: Number(prix),
        places: Number(places),
        description,
        image
    };
}

function normalizeReservation(reservation) {
    if (!reservation || typeof reservation !== 'object') {
        return null;
    }

    const evenement = reservation.evenement && typeof reservation.evenement === 'object' ? reservation.evenement : {};
    const eventId = reservation.eventId ?? evenement?.id;
    if (!eventId) {
        return null;
    }

    const utilisateur = reservation.utilisateur && typeof reservation.utilisateur === 'object' ? reservation.utilisateur : null;
    const nombreDePlaces = Number(reservation.nombreDePlaces);
    const id = typeof reservation.id === 'string' || typeof reservation.id === 'number'
        ? String(reservation.id).trim()
        : '';

    if (!utilisateur || !Number.isFinite(nombreDePlaces) || nombreDePlaces <= 0) {
        return null;
    }

    return {
        id: id || generateUniqueId('reservation'),
        eventId: String(eventId),
        evenement: {
            ...evenement,
            id: String(eventId),
            titre: typeof evenement.titre === 'string' ? evenement.titre.trim() : '',
            lieu: typeof evenement.lieu === 'string' ? evenement.lieu.trim() : '',
            date: typeof evenement.date === 'string' ? evenement.date.trim() : ''
        },
        utilisateur: {
            ...utilisateur,
            prenom: typeof utilisateur.prenom === 'string' ? utilisateur.prenom.trim() : '',
            nom: typeof utilisateur.nom === 'string' ? utilisateur.nom.trim() : '',
            email: typeof utilisateur.email === 'string' ? utilisateur.email.trim() : '',
            telephone: typeof utilisateur.telephone === 'string' ? utilisateur.telephone.trim() : ''
        },
        nombreDePlaces: Number(nombreDePlaces)
    };
}

function readJson(key, validator) {
    const storage = getStorage();
    if (!storage) {
        return [];
    }

    try {
        const rawData = storage.getItem(key);
        if (!rawData) {
            return [];
        }

        const parsed = JSON.parse(rawData);
        if (!Array.isArray(parsed)) {
            return [];
        }

        return parsed
            .map((item) => validator(item))
            .filter(Boolean);
    } catch (error) {
        return [];
    }
}

function writeJson(key, value) {
    const storage = getStorage();
    if (!storage) {
        return false;
    }

    try {
        const currentData = storage.getItem(key);
        if (currentData !== null) {
            const parsed = JSON.parse(currentData);
            if (!Array.isArray(parsed)) {
                return false;
            }
        }

        storage.setItem(key, JSON.stringify(Array.isArray(value) ? value : []));
        return true;
    } catch (error) {
        return false;
    }
}

export function sauvegarderEvenements(evenements) {
    return writeJson(STORAGE_KEYS.evenements, evenements);
}

export function sauvegarderReservations(reservations) {
    return writeJson(STORAGE_KEYS.reservations, reservations);
}

export function recupererReservations() {
    const reservations = readJson(STORAGE_KEYS.reservations, normalizeReservation);
    const storage = getStorage();
    if (!storage) {
        return reservations;
    }

    try {
        const rawData = storage.getItem(STORAGE_KEYS.reservations);
        if (!rawData) {
            return reservations;
        }

        const storedData = JSON.parse(rawData);
        const canMigrateLegacyLinks = Array.isArray(storedData)
            && storedData.length === reservations.length
            && storedData.some((reservation) => reservation
                && typeof reservation === 'object'
                && !reservation.eventId
                && reservation.evenement
                && reservation.evenement.id);
        if (canMigrateLegacyLinks) {
            sauvegarderReservations(reservations);
        }
    } catch (error) {
        return reservations;
    }

    return reservations;
}

export function recupererEvenements() {
    const events = readJson(STORAGE_KEYS.evenements, normalizeEvent);
    const seenIds = new Set();
    let repairedIds = false;

    events.forEach((event) => {
        if (seenIds.has(String(event.id))) {
            event.id = generateUniqueEventId(seenIds);
            repairedIds = true;
        }
        seenIds.add(String(event.id));
    });

    if (repairedIds) {
        writeJson(STORAGE_KEYS.evenements, events);
    }

    return events;
}

export function addEvent(event) {
    const eventToAdd = normalizeEvent(event);
    if (!eventToAdd) {
        return null;
    }

    const events = recupererEvenements();
    if (events.some((existingEvent) => String(existingEvent.id) === String(eventToAdd.id))) {
        eventToAdd.id = generateUniqueEventId(events.map((existingEvent) => existingEvent.id));
    }
    events.push(eventToAdd);
    if (!sauvegarderEvenements(events)) {
        return null;
    }
    return eventToAdd;
}

export function updateEvent(eventId, updatedEvent) {
    const events = recupererEvenements();
    const index = events.findIndex((event) => String(event.id) === String(eventId));

    if (index === -1) {
        return null;
    }

    const mergedEvent = {
        ...events[index],
        ...updatedEvent,
        id: events[index].id
    };

    const normalized = normalizeEvent(mergedEvent);
    if (!normalized) {
        return null;
    }

    events[index] = normalized;
    if (!sauvegarderEvenements(events)) {
        return null;
    }
    return normalized;
}

export function deleteEvent(eventId) {
    const events = recupererEvenements();
    if (!events.some((event) => String(event.id) === String(eventId))) {
        return null;
    }

    const filteredEvents = events.filter((event) => String(event.id) !== String(eventId));
    if (!sauvegarderEvenements(filteredEvents)) {
        return null;
    }
    return filteredEvents;
}

export function addReservation(reservation) {
    const reservationToAdd = normalizeReservation(reservation);
    if (!reservationToAdd) {
        return null;
    }

    const reservations = recupererReservations();
    if (reservations.some((existingReservation) => String(existingReservation.id) === String(reservationToAdd.id))) {
        reservationToAdd.id = generateUniqueId('reservation', reservations.map((existingReservation) => existingReservation.id));
    }
    reservations.push(reservationToAdd);
    if (!sauvegarderReservations(reservations)) {
        return null;
    }
    return reservationToAdd;
}

export function updateReservation(reservationId, updatedReservation) {
    const reservations = recupererReservations();
    const index = reservations.findIndex((reservation) => String(reservation.id) === String(reservationId));

    if (index === -1) {
        return null;
    }

    const normalized = normalizeReservation({
        ...reservations[index],
        ...updatedReservation,
        id: reservations[index].id,
        eventId: reservations[index].eventId
    });
    if (!normalized) {
        return null;
    }

    reservations[index] = normalized;
    if (!sauvegarderReservations(reservations)) {
        return null;
    }
    return normalized;
}

export function deleteReservation(reservationId) {
    const reservations = recupererReservations();
    if (!reservations.some((reservation) => String(reservation.id) === String(reservationId))) {
        return null;
    }

    const filteredReservations = reservations.filter((reservation) => String(reservation.id) !== String(reservationId));
    if (!sauvegarderReservations(filteredReservations)) {
        return null;
    }
    return filteredReservations;
}
