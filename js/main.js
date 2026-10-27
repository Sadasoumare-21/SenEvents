import { Reservation } from './reservation.js';
import { Utilisateur } from './utilisateur.js';
import { normalizeSenegalPhone } from './telephone.js';
import {
    addEvent,
    addReservation,
    deleteReservation,
    deleteEvent,
    recupererEvenements,
    recupererReservations,
    sauvegarderEvenements,
    sauvegarderReservations,
    updateReservation,
    updateEvent
} from './storage.js';

const CATEGORY_LABELS = {
    concert: 'Concert',
    sport: 'Sport',
    formation: 'Formation',
    conference: 'Conférence',
    spectacle: 'Spectacle'
};

const CATEGORY_KEYWORDS = {
    concert: ['concert', 'live', 'festival', 'musique', 'musical', 'artiste', 'chanteur', 'chanteuse', 'rappeur', 'rappeuse', 'dj', 'soirée musicale'],
    sport: ['match', 'tournoi', 'championnat', 'football', 'basketball', 'basket', 'tennis', 'course', 'marathon', 'lutte', 'compétition', 'combat', 'sport', 'coupe', 'boxe', 'rugby', 'volleyball', 'handball', 'natation', 'athlétisme'],
    conference: ['conférence', 'séminaire', 'panel', 'keynote', 'présentation', 'forum', 'colloque', 'congrès'],
    formation: ['formation', 'cours', 'atelier de formation', 'atelier d’apprentissage', "atelier d'apprentissage", 'atelier d apprentissage', 'workshop', 'bootcamp', 'apprentissage', 'apprendre'],
    spectacle: ['spectacle', 'comédie', 'danse', 'théâtre', 'humour', 'cabaret', 'one man show', 'stand up', 'cirque', 'magie']
};

const categoryValues = Object.keys(CATEGORY_LABELS);
const openModalBtn = document.getElementById('openEventModalBtn');
const eventModal = document.getElementById('eventModal');
const closeModalBtn = document.getElementById('closeEventModal');
const createEventForm = document.getElementById('createEventForm');
const eventModalTitle = document.getElementById('eventModalTitle');
const eventSubmitButton = document.getElementById('eventSubmitBtn');
const boutonsFiltres = document.querySelectorAll('.filter-btn');
const reservationModal = document.getElementById('reservationModal');
const closeReservationModalBtn = document.getElementById('closeReservationModal');
const deleteConfirmationModal = document.getElementById('deleteConfirmationModal');
const deleteConfirmationText = document.getElementById('deleteConfirmationText');
const cancelDeleteEventBtn = document.getElementById('cancelDeleteEventBtn');
const confirmDeleteEventBtn = document.getElementById('confirmDeleteEventBtn');
const rechercheInput = document.getElementById('searchInput');
const eventsContainer = document.getElementById('eventsContainer');
const reservationsContainer = document.getElementById('reservationsContainer');
const appMessage = document.getElementById('appMessage');
const faireReservationForm = document.getElementById('createReservationForm');
const eventErrorElement = document.getElementById('eventMessageErreur');
const eventSuccessElement = document.getElementById('eventMessageSucces');
const reservationErrorElement = document.getElementById('reservationMessageErreur');
const reservationSuccessElement = document.getElementById('reservationMessageSucces');
const reservationPhoneInput = document.getElementById('userPhone');
const phoneFormatMessage = document.getElementById('phoneFormatMessage');
const reservationSubmitButton = document.getElementById('reservationSubmitBtn');
const editReservationModal = document.getElementById('editReservationModal');
const editReservationForm = document.getElementById('editReservationForm');
const editReservationIdInput = document.getElementById('editReservationId');
const editReservationPlacesInput = document.getElementById('editReservationPlaces');
const editReservationDetails = document.getElementById('editReservationEventDetails');
const editReservationAvailability = document.getElementById('editReservationAvailability');
const editReservationError = document.getElementById('editReservationMessageErreur');
const closeEditReservationModalBtn = document.getElementById('closeEditReservationModal');
const cancelEditReservationBtn = document.getElementById('cancelEditReservationBtn');
const decreaseReservationPlacesBtn = document.getElementById('decreaseReservationPlaces');
const increaseReservationPlacesBtn = document.getElementById('increaseReservationPlaces');
const cancelReservationModal = document.getElementById('cancelReservationModal');
const cancelReservationDetails = document.getElementById('cancelReservationDetails');
const keepReservationBtn = document.getElementById('keepReservationBtn');
const confirmCancelReservationBtn = document.getElementById('confirmCancelReservationBtn');

let evenements = recupererEvenements();
let reservations = recupererReservations();
let currentCategory = 'tous';
let currentSearch = '';
let currentEditingEventId = null;
let pendingDeleteEventId = null;
let pendingCancelReservationId = null;
let messageErreur = '';
let messageSucces = '';

function sanitizeText(value) {
    return String(value ?? '').replace(/\s+/g, ' ').trim();
}

if (cancelDeleteEventBtn) {
    cancelDeleteEventBtn.addEventListener('click', cancelDeleteEvent);
}

if (confirmDeleteEventBtn) {
    confirmDeleteEventBtn.addEventListener('click', confirmDeleteEvent);
}

function normalizeComparable(value) {
    return sanitizeText(value)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

function generateEventId() {
    return `event-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function getEventById(eventId) {
    return evenements.find((event) => String(event.id) === String(eventId));
}

function showMessage(message, type = 'info') {
    if (!appMessage) {
        return;
    }

    appMessage.textContent = message;
    appMessage.className = `app-message ${type}`;
    appMessage.hidden = false;
}

function clearFormMessages() {
    messageErreur = '';
    messageSucces = '';
    [eventErrorElement, eventSuccessElement, reservationErrorElement, reservationSuccessElement]
        .forEach((element) => {
            if (element) {
                element.textContent = '';
                element.hidden = true;
            }
        });
    if (appMessage) {
        appMessage.hidden = true;
    }
}

function showFormError(message, form = 'event') {
    messageErreur = message;
    messageSucces = '';
    const errorElement = form === 'reservation' ? reservationErrorElement : eventErrorElement;
    const successElement = form === 'reservation' ? reservationSuccessElement : eventSuccessElement;

    if (errorElement) {
        errorElement.textContent = messageErreur;
        errorElement.hidden = false;
    }
    if (successElement) {
        successElement.textContent = '';
        successElement.hidden = true;
    }
    if (appMessage) {
        appMessage.hidden = true;
    }
}

function showFormSuccess(message, form = 'event') {
    messageErreur = '';
    messageSucces = message;
    const errorElement = form === 'reservation' ? reservationErrorElement : eventErrorElement;
    const successElement = form === 'reservation' ? reservationSuccessElement : eventSuccessElement;

    if (errorElement) {
        errorElement.textContent = '';
        errorElement.hidden = true;
    }
    if (successElement) {
        successElement.textContent = messageSucces;
        successElement.hidden = false;
    }
    showMessage(messageSucces, 'success');
}

function getTodayDateString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function validateFutureDate(date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return '⚠️ Veuillez renseigner une date valide.';
    }

    const parsedDate = new Date(`${date}T00:00:00`);
    if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) {
        return '⚠️ Veuillez renseigner une date valide.';
    }

    if (date <= getTodayDateString()) {
        return '⚠️ La date de l’événement doit être une date future. Veuillez sélectionner une date ultérieure à aujourd’hui.';
    }

    return '';
}

function formatDate(dateValue) {
    if (!dateValue) {
        return 'Date non précisée';
    }

    const parsedDate = new Date(`${dateValue}T00:00:00`);
    if (Number.isNaN(parsedDate.getTime())) {
        return dateValue;
    }

    return new Intl.DateTimeFormat('fr-FR').format(parsedDate);
}

function creerPlaceholderImage() {
    const placeholder = document.createElement('div');
    placeholder.className = 'event-img-placeholder';
    placeholder.textContent = "Pas d'image pour cet événement";
    return placeholder;
}

function getVisibleEvents() {
    let filteredEvents = [...evenements];

    if (currentCategory !== 'tous') {
        filteredEvents = filteredEvents.filter((event) => event.categorie === currentCategory);
    }

    const searchTerm = normalizeComparable(currentSearch);
    if (searchTerm) {
        filteredEvents = filteredEvents.filter((event) => {
            const title = normalizeComparable(event.titre);
            const location = normalizeComparable(event.lieu);
            const category = normalizeComparable(CATEGORY_LABELS[event.categorie] ?? event.categorie);
            return title.includes(searchTerm) || location.includes(searchTerm) || category.includes(searchTerm);
        });
    }

    return filteredEvents;
}

function renderEvents() {
    if (!eventsContainer) {
        return;
    }

    const visibleEvents = getVisibleEvents();
    eventsContainer.innerHTML = '';

    if (visibleEvents.length === 0) {
        const emptyState = document.createElement('p');
        emptyState.className = 'empty-state';
        emptyState.textContent = 'Aucun événement disponible pour le moment.';
        eventsContainer.appendChild(emptyState);
        return;
    }

    visibleEvents.forEach((evenement) => {
        const article = document.createElement('article');
        article.className = 'event-card';

        if (evenement.image) {
            const img = document.createElement('img');
            img.src = evenement.image;
            img.alt = evenement.titre;
            img.className = 'event-img';
            img.addEventListener('error', () => {
                img.replaceWith(creerPlaceholderImage());
            }, { once: true });
            article.appendChild(img);
        } else {
            article.appendChild(creerPlaceholderImage());
        }

        const cardHeader = document.createElement('div');
        cardHeader.className = 'event-card-header';

        const title = document.createElement('h3');
        title.className = 'event-title';
        title.textContent = evenement.titre;

        const category = document.createElement('span');
        category.className = 'event-category';
        category.textContent = CATEGORY_LABELS[evenement.categorie] ?? evenement.categorie;

        cardHeader.append(title, category);

        const details = document.createElement('dl');
        details.className = 'event-details';

        [
            ['Lieu', evenement.lieu],
            ['Date', formatDate(evenement.date)],
            ['Prix', `${Number(evenement.prix) || 0} FCFA`],
            ['Places disponibles', evenement.places]
        ].forEach(([label, value]) => {
            const detail = document.createElement('div');
            detail.className = 'event-detail';

            const term = document.createElement('dt');
            term.textContent = label;

            const description = document.createElement('dd');
            description.textContent = String(value);

            detail.append(term, description);
            details.appendChild(detail);
        });

        article.append(cardHeader, details);

        if (evenement.description) {
            const description = document.createElement('p');
            description.className = 'event-description';
            description.textContent = evenement.description;
            article.appendChild(description);
        }

        const actionGroup = document.createElement('div');
        actionGroup.className = 'event-actions';

        const editButton = document.createElement('button');
        editButton.type = 'button';
        editButton.className = 'btn-action btn-secondary';
        editButton.textContent = 'Modifier';
        editButton.addEventListener('click', () => {
            openEventModal('edit', evenement);
        });

        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'btn-action btn-danger';
        deleteButton.textContent = 'Supprimer';
        deleteButton.addEventListener('click', () => {
            handleDeleteEvent(evenement.id);
        });

        actionGroup.append(editButton, deleteButton);

        const btnReserver = document.createElement('button');
        btnReserver.type = 'button';
        btnReserver.textContent = evenement.places > 0 ? 'Réserver 🎟️' : 'Complet';
        btnReserver.className = 'btn-submit';
        btnReserver.disabled = evenement.places < 1;

        btnReserver.addEventListener('click', () => {
            const reservationPlacesInput = document.getElementById('reservationPlaces');
            const modalEventId = document.getElementById('modalEventId');
            clearFormMessages();
            faireReservationForm.reset();

            if (reservationPlacesInput) {
                reservationPlacesInput.max = String(evenement.places);
                reservationPlacesInput.value = '1';
            }
            reservationSubmitButton.textContent = 'Confirmer la réservation';
            phoneFormatMessage.textContent = 'Numéro mobile sénégalais (70, 75, 76, 77 ou 78), avec ou sans indicatif +221.';
            phoneFormatMessage.classList.remove('error', 'success');
            if (modalEventId) {
                modalEventId.value = String(evenement.id);
            }

            reservationModal.classList.add('active');
        });

        article.append(actionGroup, btnReserver);
        eventsContainer.appendChild(article);
    });
}

function renderReservations() {
    if (!reservationsContainer) {
        return;
    }

    reservationsContainer.replaceChildren();

    if (reservations.length === 0) {
        const message = document.createElement('p');
        message.className = 'empty-state';
        message.textContent = 'Aucune réservation pour le moment.';
        reservationsContainer.appendChild(message);
        return;
    }

    reservations.forEach((reservation) => {
        const eventId = reservation.eventId ?? reservation.evenement?.id;
        const linkedEvent = getEventById(eventId) ?? reservation.evenement ?? {};
        const article = document.createElement('article');
        article.className = 'reservation-card';

        const cardHeader = document.createElement('div');
        cardHeader.className = 'reservation-card-header';
        const reservationBadge = document.createElement('span');
        reservationBadge.className = 'reservation-badge';
        reservationBadge.textContent = '🎟️ RÉSERVATION';
        cardHeader.appendChild(reservationBadge);

        const eventTitle = document.createElement('h3');
        eventTitle.className = 'reservation-event-title';
        eventTitle.textContent = linkedEvent.titre || 'Événement';
        cardHeader.appendChild(eventTitle);

        const eventDetails = document.createElement('div');
        eventDetails.className = 'reservation-event-details';
        const dateDetail = document.createElement('p');
        dateDetail.textContent = `📅 ${linkedEvent.date ? formatDate(linkedEvent.date) : 'Date inconnue'}`;
        const locationDetail = document.createElement('p');
        locationDetail.textContent = `📍 ${linkedEvent.lieu || 'Lieu inconnu'}`;
        eventDetails.append(dateDetail, locationDetail);

        const customerName = reservation.utilisateur && reservation.utilisateur.prenom && reservation.utilisateur.nom
            ? `${reservation.utilisateur.prenom} ${reservation.utilisateur.nom}`
            : 'Un utilisateur';
        const reservationSummary = document.createElement('div');
        reservationSummary.className = 'reservation-summary';
        const customer = document.createElement('p');
        customer.className = 'reservation-customer';
        customer.textContent = `👤 ${customerName}`;
        const seats = document.createElement('p');
        seats.className = 'reservation-seats';
        seats.textContent = `🎟️ ${reservation.nombreDePlaces} place${reservation.nombreDePlaces === 1 ? '' : 's'} réservée${reservation.nombreDePlaces === 1 ? '' : 's'}`;
        reservationSummary.append(customer, seats);

        const actions = document.createElement('div');
        actions.className = 'reservation-actions';
        const editButton = document.createElement('button');
        editButton.type = 'button';
        editButton.className = 'btn-action btn-reservation-edit';
        editButton.textContent = 'Modifier';
        editButton.addEventListener('click', () => openReservationEditModal(reservation));

        const cancelButton = document.createElement('button');
        cancelButton.type = 'button';
        cancelButton.className = 'btn-action btn-reservation-cancel';
        cancelButton.textContent = 'Annuler';
        cancelButton.addEventListener('click', () => openReservationCancelModal(reservation));
        actions.append(editButton, cancelButton);

        article.append(cardHeader, eventDetails, reservationSummary, actions);
        reservationsContainer.appendChild(article);
    });
}

function getLinkedEventId(reservation) {
    return reservation.eventId ?? reservation.evenement?.id ?? null;
}

function getBookedSeatsForEvent(eventId, excludedReservationId = null) {
    return reservations.reduce((total, reservation) => {
        if (String(getLinkedEventId(reservation)) !== String(eventId)
            || String(reservation.id) === String(excludedReservationId)) {
            return total;
        }
        return total + Number(reservation.nombreDePlaces || 0);
    }, 0);
}

function openReservationEditModal(reservation) {
    const eventId = getLinkedEventId(reservation);
    const linkedEvent = getEventById(eventId) ?? reservation.evenement;
    if (!linkedEvent || !editReservationModal || !editReservationForm) {
        messageErreur = '⚠️ L’événement lié à cette réservation est introuvable.';
        messageSucces = '';
        showMessage(messageErreur, 'error');
        return;
    }

    clearFormMessages();
    editReservationError.textContent = '';
    editReservationError.hidden = true;
    editReservationIdInput.value = String(reservation.id);
    editReservationPlacesInput.value = String(reservation.nombreDePlaces);
    editReservationPlacesInput.dataset.originalSeats = String(reservation.nombreDePlaces);
    editReservationPlacesInput.max = String(Number(linkedEvent.places) + Number(reservation.nombreDePlaces));
    editReservationDetails.textContent = `${linkedEvent.titre || 'Événement'} · ${linkedEvent.date ? formatDate(linkedEvent.date) : 'Date inconnue'} · ${linkedEvent.lieu || 'Lieu inconnu'}`;
    editReservationAvailability.textContent = `${linkedEvent.places} place${linkedEvent.places === 1 ? '' : 's'} actuellement disponible${linkedEvent.places === 1 ? '' : 's'}.`;
    editReservationModal.classList.add('active');
}

function closeReservationEditModal() {
    if (editReservationModal) {
        editReservationModal.classList.remove('active');
    }
    if (editReservationForm) {
        editReservationForm.reset();
    }
}

function showReservationEditError(message) {
    messageErreur = message;
    messageSucces = '';
    editReservationError.textContent = messageErreur;
    editReservationError.hidden = false;
}

function handleReservationEditSubmit(event) {
    event.preventDefault();
    clearFormMessages();
    editReservationError.textContent = '';
    editReservationError.hidden = true;

    const reservation = reservations.find((item) => String(item.id) === String(editReservationIdInput.value));
    if (!reservation) {
        showReservationEditError('⚠️ Cette réservation est introuvable.');
        return;
    }

    const eventId = getLinkedEventId(reservation);
    const linkedEvent = getEventById(eventId);
    if (!linkedEvent) {
        showReservationEditError('⚠️ L’événement lié à cette réservation est introuvable.');
        return;
    }

    const requestedSeats = Number(editReservationPlacesInput.value);
    const oldSeats = Number(reservation.nombreDePlaces);
    if (!Number.isInteger(requestedSeats) || requestedSeats < 1) {
        showReservationEditError('⚠️ Le nombre de places doit être un entier supérieur à zéro.');
        return;
    }

    const maxSeats = Number(linkedEvent.places) + oldSeats;
    if (requestedSeats > maxSeats) {
        showReservationEditError(`⚠️ Il ne reste que ${linkedEvent.places} place${linkedEvent.places === 1 ? '' : 's'} disponible${linkedEvent.places === 1 ? '' : 's'}.`);
        return;
    }

    const nextAvailableSeats = Number(linkedEvent.places) + oldSeats - requestedSeats;
    if (nextAvailableSeats < 0) {
        showReservationEditError('⚠️ Le nombre de places demandé dépasse les places disponibles.');
        return;
    }

    const updatedReservation = updateReservation(reservation.id, {
        ...reservation,
        eventId: String(linkedEvent.id),
        evenement: { ...linkedEvent },
        nombreDePlaces: requestedSeats
    });
    if (!updatedReservation) {
        showReservationEditError('⚠️ Impossible d’enregistrer la modification de la réservation.');
        return;
    }

    const nextEvents = evenements.map((item) => String(item.id) === String(linkedEvent.id)
        ? { ...item, places: nextAvailableSeats }
        : item);
    if (!sauvegarderEvenements(nextEvents)) {
        if (!sauvegarderReservations(reservations)) {
            showReservationEditError('⚠️ La mise à jour des places a échoué et la réservation n’a pas pu être restaurée. Rechargez la page pour vérifier les données.');
            return;
        }
        showReservationEditError('⚠️ Impossible de mettre à jour les places disponibles. La réservation n’a pas été modifiée.');
        return;
    }

    evenements = nextEvents;
    reservations = recupererReservations();
    closeReservationEditModal();
    render();
    messageErreur = '';
    messageSucces = '✅ Réservation modifiée avec succès.';
    showMessage(messageSucces, 'success');
}

function openReservationCancelModal(reservation) {
    const linkedEvent = getEventById(getLinkedEventId(reservation)) ?? reservation.evenement ?? {};
    pendingCancelReservationId = reservation.id;
    cancelReservationDetails.textContent = `Vous avez réservé ${reservation.nombreDePlaces} place${reservation.nombreDePlaces === 1 ? '' : 's'} pour ${linkedEvent.titre || 'Événement'} · ${linkedEvent.date ? formatDate(linkedEvent.date) : 'Date inconnue'} · ${linkedEvent.lieu || 'Lieu inconnu'}.`;
    clearFormMessages();
    cancelReservationModal.classList.add('active');
}

function closeReservationCancelModal() {
    pendingCancelReservationId = null;
    cancelReservationModal.classList.remove('active');
}

function confirmCancelReservation() {
    const reservation = reservations.find((item) => String(item.id) === String(pendingCancelReservationId));
    if (!reservation) {
        closeReservationCancelModal();
        messageErreur = '⚠️ Cette réservation est introuvable.';
        messageSucces = '';
        showMessage(messageErreur, 'error');
        return;
    }

    const eventId = getLinkedEventId(reservation);
    const linkedEvent = getEventById(eventId);
    const oldEvents = evenements;
    let nextEvents = oldEvents;
    if (linkedEvent) {
        const bookedByOthers = getBookedSeatsForEvent(eventId, reservation.id);
        const inferredCapacity = Number(linkedEvent.places) + getBookedSeatsForEvent(eventId);
        const restoredSeats = inferredCapacity - bookedByOthers;
        if (!Number.isInteger(restoredSeats) || restoredSeats < 0 || restoredSeats > inferredCapacity) {
            messageErreur = '⚠️ L’annulation dépasserait la capacité de l’événement. Les données n’ont pas été modifiées.';
            messageSucces = '';
            showMessage(messageErreur, 'error');
            return;
        }
        nextEvents = oldEvents.map((item) => String(item.id) === String(eventId)
            ? { ...item, places: restoredSeats }
            : item);
        if (!sauvegarderEvenements(nextEvents)) {
            messageErreur = '⚠️ Impossible de remettre les places à disposition. La réservation n’a pas été annulée.';
            messageSucces = '';
            showMessage(messageErreur, 'error');
            return;
        }
    }

    const nextReservations = deleteReservation(reservation.id);
    if (!nextReservations) {
        if (linkedEvent && !sauvegarderEvenements(oldEvents)) {
            messageErreur = '⚠️ L’annulation a échoué et les places n’ont pas pu être restaurées. Rechargez la page pour vérifier les données.';
        } else {
            messageErreur = '⚠️ Impossible de supprimer la réservation.';
        }
        messageSucces = '';
        showMessage(messageErreur, 'error');
        return;
    }

    evenements = nextEvents;
    reservations = nextReservations;
    closeReservationCancelModal();
    render();
    messageErreur = '';
    messageSucces = '✅ Réservation annulée avec succès.';
    showMessage(messageSucces, 'success');
}

function render() {
    renderEvents();
    renderReservations();
    setActiveFilterButton();
}

function setActiveFilterButton() {
    boutonsFiltres.forEach((bouton) => {
        const isActive = bouton.dataset.category === currentCategory;
        bouton.classList.toggle('active', isActive);
    });
}

function openEventModal(mode = 'create', event = null) {
    if (!eventModal || !createEventForm || !eventModalTitle || !eventSubmitButton) {
        return;
    }

    clearFormMessages();
    createEventForm.reset();
    currentEditingEventId = mode === 'edit' && event ? event.id : null;

    if (mode === 'edit' && event) {
        eventModalTitle.textContent = 'Modifier l\'événement';
        eventSubmitButton.textContent = 'Enregistrer les modifications';

        document.getElementById('eventTitle').value = event.titre || '';
        document.getElementById('eventCategory').value = event.categorie || 'concert';
        document.getElementById('eventLocation').value = event.lieu || '';
        document.getElementById('eventDate').value = event.date || '';
        document.getElementById('eventPrice').value = event.prix ?? 0;
        document.getElementById('eventPlaces').value = event.places ?? 1;
        document.getElementById('eventDescription').value = event.description || '';
        document.getElementById('eventImage').value = event.image || '';
    } else {
        eventModalTitle.textContent = 'Créer un nouvel événement';
        eventSubmitButton.textContent = 'Publier l\'événement';
    }

    eventModal.classList.add('active');
}

function closeEventModal() {
    if (eventModal) {
        eventModal.classList.remove('active');
    }

    currentEditingEventId = null;
    if (createEventForm) {
        createEventForm.reset();
    }
}

function normalizeEventInput() {
    return {
        titre: sanitizeText(document.getElementById('eventTitle').value),
        categorie: sanitizeText(document.getElementById('eventCategory').value),
        lieu: sanitizeText(document.getElementById('eventLocation').value),
        date: sanitizeText(document.getElementById('eventDate').value),
        prix: sanitizeText(document.getElementById('eventPrice').value),
        places: sanitizeText(document.getElementById('eventPlaces').value),
        description: sanitizeText(document.getElementById('eventDescription').value),
        image: sanitizeText(document.getElementById('eventImage').value)
    };
}

function validateRequiredEventFields(values) {
    if (!values.titre) {
        return '⚠️ Le titre est obligatoire.';
    }

    if (!values.categorie || !categoryValues.includes(values.categorie)) {
        return '⚠️ Veuillez sélectionner une catégorie valide.';
    }

    if (!values.lieu) {
        return '⚠️ Veuillez renseigner le lieu de l’événement.';
    }

    if (!values.date) {
        return '⚠️ Veuillez renseigner une date.';
    }

    return validateFutureDate(values.date);
}

function validateOtherEventFields(values) {
    if (values.titre.length < 2) {
        return '⚠️ Le titre est trop court.';
    }

    if (values.titre.length > 140) {
        return '⚠️ Le titre est trop long. Limitez-vous à 140 caractères.';
    }

    const prix = Number(values.prix);
    if (!values.prix || !Number.isFinite(prix) || prix < 0) {
        return '⚠️ Le prix doit être un nombre valide et ne peut pas être négatif.';
    }

    const places = Number(values.places);
    if (!values.places || !Number.isInteger(places) || places < 1) {
        return '⚠️ Le nombre de places doit être un entier supérieur à 0.';
    }

    if (values.description.length > 800) {
        return '⚠️ La description est trop longue.';
    }

    if (values.image && !/^https?:\/\//i.test(values.image) && !/^data:image\//i.test(values.image)) {
        return '⚠️ L’URL de l’image n’est pas valide.';
    }

    return '';
}

function buildEventData(values) {
    return {
        id: currentEditingEventId ?? generateEventId(),
        titre: values.titre,
        categorie: values.categorie,
        lieu: values.lieu,
        date: values.date,
        prix: Number(values.prix),
        places: Number(values.places),
        description: values.description,
        image: values.image
    };
}

function validateCategoryMatch(title, category) {
    const normalizedTitle = normalizeComparable(title);
    if (!normalizedTitle) {
        return null;
    }

    const containsKeyword = (keyword) => {
        const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(`(^|[^a-z0-9])${escapedKeyword}($|[^a-z0-9])`).test(normalizedTitle);
    };

    const matches = Object.entries(CATEGORY_KEYWORDS)
        .map(([candidateCategory, keywords]) => ({
            category: candidateCategory,
            score: keywords.reduce((count, keyword) => count + (containsKeyword(normalizeComparable(keyword)) ? 1 : 0), 0)
        }))
        .filter((candidate) => candidate.score > 0)
        .sort((a, b) => b.score - a.score);

    if (!matches.length) {
        return null;
    }

    const bestMatch = matches[0];
    if (matches.length > 1 && matches[1].score === bestMatch.score) {
        return null;
    }

    const categoryMatch = matches.find((match) => match.category === category);
    if (categoryMatch && categoryMatch.score === bestMatch.score) {
        return null;
    }

    return `⚠️ Le titre semble correspondre à la catégorie « ${CATEGORY_LABELS[bestMatch.category] ?? bestMatch.category} ». Vérifiez que la catégorie sélectionnée est correcte.`;
}

function isDuplicateEvent(candidateTitle, candidateDate, candidateLocation, excludedId = null) {
    const normalizedTitle = normalizeComparable(candidateTitle);
    const normalizedDate = normalizeComparable(candidateDate);
    const normalizedLocation = normalizeComparable(candidateLocation);

    return evenements.some((event) => {
        if (String(event.id) === String(excludedId)) {
            return false;
        }

        return normalizeComparable(event.titre) === normalizedTitle
            && normalizeComparable(event.date) === normalizedDate
            && normalizeComparable(event.lieu) === normalizedLocation;
    });
}

function handleDeleteEvent(eventId) {
    clearFormMessages();
    const eventToDelete = getEventById(eventId);
    if (!eventToDelete) {
        showMessage('⚠️ L’événement à supprimer est introuvable.', 'error');
        return;
    }

    pendingDeleteEventId = eventToDelete.id;
    deleteConfirmationText.textContent = `Voulez-vous vraiment supprimer « ${eventToDelete.titre} » ?`;
    deleteConfirmationModal.classList.add('active');
}

function confirmDeleteEvent() {
    const eventId = pendingDeleteEventId;
    const eventToDelete = getEventById(eventId);
    if (!eventToDelete) {
        deleteConfirmationModal.classList.remove('active');
        pendingDeleteEventId = null;
        showMessage('⚠️ L’événement à supprimer est introuvable.', 'error');
        return;
    }

    const nextReservations = reservations.filter((reservation) => {
        const linkedEventId = getLinkedEventId(reservation);
        return String(linkedEventId) !== String(eventId);
    });

    if (!sauvegarderReservations(nextReservations)) {
        cancelDeleteEvent();
        messageErreur = '⚠️ Impossible de sauvegarder la suppression. Aucune donnée n’a été supprimée.';
        showMessage(messageErreur, 'error');
        return;
    }

    const nextEvents = deleteEvent(eventId);
    if (!nextEvents) {
        if (!sauvegarderReservations(reservations)) {
            cancelDeleteEvent();
            messageErreur = '⚠️ La suppression a échoué et les réservations n’ont pas pu être restaurées. Rechargez la page pour vérifier les données.';
            showMessage(messageErreur, 'error');
            return;
        }
        cancelDeleteEvent();
        messageErreur = '⚠️ Impossible de sauvegarder la suppression. Aucune donnée n’a été supprimée.';
        showMessage(messageErreur, 'error');
        return;
    }

    evenements = nextEvents;
    reservations = nextReservations;
    pendingDeleteEventId = null;
    deleteConfirmationModal.classList.remove('active');
    render();
    messageSucces = '✅ Événement supprimé avec succès.';
    showMessage(messageSucces, 'success');
}

function cancelDeleteEvent() {
    pendingDeleteEventId = null;
    deleteConfirmationModal.classList.remove('active');
}

function handleEventSubmit(event) {
    event.preventDefault();
    clearFormMessages();

    const values = normalizeEventInput();

    const requiredFieldError = validateRequiredEventFields(values);
    if (requiredFieldError) {
        showFormError(requiredFieldError, 'event');
        return;
    }

    const categoryWarning = validateCategoryMatch(values.titre, values.categorie);
    if (categoryWarning) {
        showFormError(`${categoryWarning} Veuillez sélectionner la catégorie appropriée.`, 'event');
        return;
    }

    const duplicateEvent = isDuplicateEvent(values.titre, values.date, values.lieu, currentEditingEventId);
    if (duplicateEvent) {
        showFormError('⚠️ Cet événement existe déjà. Vérifiez le titre, la date et le lieu avant de continuer.', 'event');
        return;
    }

    const otherFieldError = validateOtherEventFields(values);
    if (otherFieldError) {
        showFormError(otherFieldError, 'event');
        return;
    }

    const eventData = buildEventData(values);
    const wasEditing = Boolean(currentEditingEventId);
    const storedEvent = wasEditing
        ? updateEvent(currentEditingEventId, eventData)
        : addEvent(eventData);

    if (!storedEvent) {
        showFormError('⚠️ Impossible d’enregistrer l’événement. Vérifiez l’espace de stockage disponible puis réessayez.', 'event');
        return;
    }

    evenements = recupererEvenements();
    render();
    closeEventModal();
    showFormSuccess(wasEditing ? '✅ Événement modifié avec succès.' : '✅ Événement créé avec succès.', 'event');
}

function validateReservationFields() {
    const eventId = document.getElementById('modalEventId').value;
    const evenementConcerne = getEventById(eventId);
    const prenom = sanitizeText(document.getElementById('userFirstName').value);
    const nom = sanitizeText(document.getElementById('userLastName').value);
    const email = sanitizeText(document.getElementById('userEmail').value);
    const telephone = normalizeSenegalPhone(reservationPhoneInput.value);
    const rawPlaces = sanitizeText(document.getElementById('reservationPlaces').value);
    const places = Number(rawPlaces);

    if (!evenementConcerne) {
        return { error: '⚠️ L’événement sélectionné est introuvable.' };
    }
    if (!evenementConcerne.places || evenementConcerne.places < 1) {
        return { error: '⚠️ Désolé, il n’y a plus de places disponibles pour cet événement.' };
    }
    if (!prenom || !nom || !email || !sanitizeText(reservationPhoneInput.value)) {
        return { error: '⚠️ Veuillez remplir tous les champs de réservation.' };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { error: '⚠️ Veuillez renseigner une adresse e-mail valide.' };
    }
    if (!telephone) {
        return { error: '⚠️ Saisissez un numéro mobile sénégalais valide (70, 75, 76, 77 ou 78), suivi de 7 chiffres.' };
    }
    if (!rawPlaces || !Number.isInteger(places) || places < 1) {
        return { error: '⚠️ Le nombre de places doit être un entier supérieur à zéro.' };
    }
    if (places > evenementConcerne.places) {
        return { error: `⚠️ Le nombre de places demandé dépasse le stock disponible (${evenementConcerne.places}).` };
    }

    return { evenement: evenementConcerne, prenom, nom, email, telephone, places };
}

function saveValidatedReservation(values) {
    const { evenement: evenementConcerne, prenom, nom, email, telephone, places } = values;
    const utilisateur = new Utilisateur(prenom, nom, email, telephone);
    const nouvelleReservation = new Reservation(evenementConcerne, utilisateur, places);
    nouvelleReservation.eventId = String(evenementConcerne.id);
    nouvelleReservation.evenement = { ...evenementConcerne };

    const storedReservation = addReservation(nouvelleReservation);
    if (!storedReservation) {
        showFormError('⚠️ Impossible d’enregistrer la réservation. Aucune place n’a été débitée.', 'reservation');
        return;
    }

    const nextEvents = evenements.map((event) => String(event.id) === String(evenementConcerne.id)
        ? { ...event, places: event.places - places }
        : event);
    if (!sauvegarderEvenements(nextEvents)) {
        if (!deleteReservation(storedReservation.id)) {
            showFormError('⚠️ La réservation n’a pas pu être finalisée et son annulation a échoué. Rechargez la page pour vérifier les données.', 'reservation');
            return;
        }
        showFormError('⚠️ Impossible de mettre à jour les places disponibles. La réservation a été annulée.', 'reservation');
        return;
    }

    evenements = nextEvents;
    reservations = recupererReservations();
    render();
    faireReservationForm.reset();
    reservationSubmitButton.textContent = 'Confirmer la réservation';
    reservationModal.classList.remove('active');
    showFormSuccess('✅ Réservation effectuée avec succès.', 'reservation');
}

function handleReservationSubmit(event) {
    event.preventDefault();
    clearFormMessages();

    const validation = validateReservationFields();
    if (validation.error) {
        showFormError(validation.error, 'reservation');
        return;
    }
    saveValidatedReservation(validation);
}

if (openModalBtn) {
    openModalBtn.addEventListener('click', () => openEventModal('create'));
}

if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeEventModal);
}

if (createEventForm) {
    createEventForm.addEventListener('submit', handleEventSubmit);
}

if (closeReservationModalBtn) {
    closeReservationModalBtn.addEventListener('click', () => {
        reservationModal.classList.remove('active');
    });
}

window.addEventListener('click', (event) => {
    if (event.target === eventModal) {
        closeEventModal();
    }

    if (event.target === reservationModal) {
        reservationModal.classList.remove('active');
    }

    if (event.target === deleteConfirmationModal) {
        cancelDeleteEvent();
    }

    if (event.target === editReservationModal) {
        closeReservationEditModal();
    }

    if (event.target === cancelReservationModal) {
        closeReservationCancelModal();
    }
});

if (faireReservationForm) {
    faireReservationForm.addEventListener('submit', handleReservationSubmit);
}

if (reservationPhoneInput) {
    reservationPhoneInput.addEventListener('input', () => {
        const normalizedPhone = normalizeSenegalPhone(reservationPhoneInput.value);
        if (!reservationPhoneInput.value.trim()) {
            phoneFormatMessage.textContent = 'Numéro mobile sénégalais (70, 75, 76, 77 ou 78), avec ou sans indicatif +221.';
            phoneFormatMessage.classList.remove('error', 'success');
        } else if (!normalizedPhone) {
            phoneFormatMessage.textContent = 'Format invalide : mobile sénégalais (70, 75, 76, 77 ou 78), suivi de 7 chiffres.';
            phoneFormatMessage.classList.add('error');
            phoneFormatMessage.classList.remove('success');
        } else {
            phoneFormatMessage.textContent = `Format valide (${normalizedPhone}).`;
            phoneFormatMessage.classList.add('success');
            phoneFormatMessage.classList.remove('error');
        }
    });
}

if (editReservationForm) {
    editReservationForm.addEventListener('submit', handleReservationEditSubmit);
}

if (closeEditReservationModalBtn) {
    closeEditReservationModalBtn.addEventListener('click', closeReservationEditModal);
}

if (cancelEditReservationBtn) {
    cancelEditReservationBtn.addEventListener('click', closeReservationEditModal);
}

if (decreaseReservationPlacesBtn) {
    decreaseReservationPlacesBtn.addEventListener('click', () => {
        editReservationPlacesInput.value = String(Math.max(1, Number(editReservationPlacesInput.value || 1) - 1));
        editReservationPlacesInput.dispatchEvent(new Event('input', { bubbles: true }));
    });
}

if (increaseReservationPlacesBtn) {
    increaseReservationPlacesBtn.addEventListener('click', () => {
        editReservationPlacesInput.value = String(Number(editReservationPlacesInput.value || 0) + 1);
        editReservationPlacesInput.dispatchEvent(new Event('input', { bubbles: true }));
    });
}

if (editReservationPlacesInput) {
    editReservationPlacesInput.addEventListener('input', () => {
        const requestedSeats = Number(editReservationPlacesInput.value);
        const maxSeats = Number(editReservationPlacesInput.max);
        if (editReservationPlacesInput.value && requestedSeats > maxSeats) {
            const availableSeats = Math.max(0, maxSeats - Number(editReservationPlacesInput.dataset.originalSeats || 0));
            showReservationEditError(`⚠️ Il ne reste que ${availableSeats} place${availableSeats === 1 ? '' : 's'} disponible${availableSeats === 1 ? '' : 's'}.`);
        } else {
            editReservationError.textContent = '';
            editReservationError.hidden = true;
            messageErreur = '';
        }
    });
}

if (keepReservationBtn) {
    keepReservationBtn.addEventListener('click', closeReservationCancelModal);
}

if (confirmCancelReservationBtn) {
    confirmCancelReservationBtn.addEventListener('click', confirmCancelReservation);
}

function validateEventFormInRealTime() {
    clearFormMessages();
    const values = normalizeEventInput();
    const dateError = values.date ? validateFutureDate(values.date) : '';
    if (dateError) {
        showFormError(dateError, 'event');
        return;
    }

    if (values.titre && values.categorie) {
        const categoryError = validateCategoryMatch(values.titre, values.categorie);
        if (categoryError) {
            showFormError(`${categoryError} Veuillez sélectionner la catégorie appropriée.`, 'event');
        }
    }
}

['eventTitle', 'eventCategory', 'eventDate'].forEach((id) => {
    const field = document.getElementById(id);
    if (field) {
        field.addEventListener('input', validateEventFormInRealTime);
        field.addEventListener('change', validateEventFormInRealTime);
    }
});

if (faireReservationForm) {
    faireReservationForm.addEventListener('input', clearFormMessages);
    faireReservationForm.addEventListener('change', clearFormMessages);
}

boutonsFiltres.forEach((bouton) => {
    bouton.addEventListener('click', () => {
        currentCategory = bouton.dataset.category || 'tous';
        currentSearch = '';
        if (rechercheInput) {
            rechercheInput.value = '';
        }
        render();
    });
});

if (rechercheInput) {
    rechercheInput.addEventListener('input', (event) => {
        currentSearch = sanitizeText(event.target.value);
        renderEvents();
    });
}

render();
showMessage('Bienvenue dans Sen Events. Créez un nouvel événement pour commencer.', 'info');