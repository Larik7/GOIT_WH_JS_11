// https://pixabay.com/api/
// user_id:33216528
// 33216528-23de23ca9469467d8b488f0af
// import axios from 'axios';
import Notiflix from 'notiflix';
import SimpleLightbox from 'simplelightbox';
import SearchService from './search-service';
import './css/styles.css';
import 'simplelightbox/dist/simple-lightbox.min.css';

let useInfiniteScroll = false;

const searchService = new SearchService();

const refs = {
  formSearch:    document.querySelector('#search-form'),
  gallery:       document.querySelector('.gallery'),
  btnSearch:     document.querySelector('button[type="submit"]'),
  btnLoadMore:   document.querySelector('button.load-more'),
  finishText:    document.querySelector('.finish-text'),
  guardDiv:      document.querySelector('.js-guard'),
  infiniteCheck: document.querySelector('.infinite-scroll-check'),
};

if (Object.values(refs).some(el => !el)) {
  throw new Error('Error: invalid markup!');
}

const observerOpts = {
  root: null,
  rootMargin: '300px',
  threshold: 1.0
}

const onObserve = (entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      onLoadMore();
    }
  });
}

const observer = new IntersectionObserver(onObserve, observerOpts);

const lightboxOpts = {
  captionsData: 'alt',
  captionPosition: 'bottom',
  captionDelay: 250,
};

const lightbox = new SimpleLightbox('.gallery .gallery__link', lightboxOpts);

refs.formSearch.addEventListener('submit', onSearch);
refs.btnLoadMore.addEventListener('click', onLoadMore);

function onSearch(evt) {
  evt.preventDefault();

  const searchQuery = evt.currentTarget.elements.searchQuery.value.trim();
  
  if (!searchQuery) {
    Notiflix.Notify.failure('Please enter a search query!');
    return;
  }

  useInfiniteScroll = refs.infiniteCheck.checked;
  refs.infiniteCheck.disabled = true;

  initQuery(searchQuery);
  performQuery();
}

function onLoadMore() {
  searchService.incrementPage();
  performQuery();
}

function initQuery(searchQuery) {
  searchService.setNewQuery(searchQuery);
  refs.gallery.innerHTML = '';
  if (useInfiniteScroll) {
    observer.unobserve(refs.guardDiv);
  } else {
    refs.btnLoadMore.classList.add('is-hidden');
  }
  refs.finishText.classList.add('is-hidden');
}

async function performQuery() {
  try {
    refs.btnSearch.disabled = true;
    refs.btnLoadMore.disabled = true;

    const data = await searchService.getNextData();

    if (!data || (data.length === 0)) {
      Notiflix.Notify.failure('Sorry, there are no images matching your search query. Please try again.');
      return;
    }
      
    if (searchService.page === 1) {
      Notiflix.Notify.success(`Hooray! We found ${searchService.resultsQty} images.`);
      if (useInfiniteScroll) {
        observer.observe(refs.guardDiv);
      }
    }

    refs.gallery.insertAdjacentHTML('beforeend', createGalleryMarkup(data));

    refreshPage();

  } catch (err) {
    console.error(err);
  } finally {
    refs.btnSearch.disabled   = false;
    refs.btnLoadMore.disabled = false;
  }
}

function createGalleryMarkup(data) {
  return data.map(({webformatURL, largeImageURL, tags, likes, views, comments, downloads}) => `
    <li class="gallery__item">
      <a class="gallery__link" href="${largeImageURL}">
        <div class="gallery__thumb">
          <img 
            class="gallery__image"
            src="${webformatURL}"
            data-source="${largeImageURL}"
            alt="${tags}"
            loading="lazy" />
        </div>    
        <div class="gallery__info">
          <p class="info__item">
            <b>Likes</b><br>${likes}
          </p>
          <p class="info__item">
            <b>Views</b><br>${views}
          </p>
          <p class="info__item">
            <b>Comments</b><br>${comments}
          </p>
          <p class="info__item">
            <b>Downloads</b><br>${downloads}
          </p>
        </div>
      </a>
    </li>
  `).join('');
}

function refreshPage() {

  lightbox.refresh();

  if (searchService.isLastPage()) {
    if (useInfiniteScroll) {
      observer.unobserve(refs.guardDiv);
    } else {
      refs.btnLoadMore.classList.add('is-hidden');
    }
    refs.finishText.classList.remove('is-hidden');
  } else {
    if (!useInfiniteScroll) {
      refs.btnLoadMore.classList.remove('is-hidden');
    }
    refs.finishText.classList.add('is-hidden');
  }
 
  if ((searchService.page > 1) && !useInfiniteScroll) {

    const { height: cardHeight } = refs.gallery.firstElementChild.getBoundingClientRect();

    window.scrollBy({
      top: cardHeight * -2,
      behavior: "smooth",
    });
  }
}
