import axios from 'axios';

const BASE_URL = 'https://pixabay.com/api/';
const KEY_API  = '33216528-23de23ca9469467d8b488f0af';

export default class SearchService {
  searchQuery;
  page;
  per_page;
  resultsQty;
  pagesQty;

  constructor(searchQuery = '', per_page = 40) {
    this.setNewQuery(searchQuery, per_page);
  }

  setNewQuery(newQuery, per_page = 40) {
    this.searchQuery = newQuery;
    this.page = 1;
    this.per_page = per_page;
  }

  incrementPage() {
    this.page += 1;
  }

  isLastPage() {
    return !(this.page < this.pagesQty);
  }

  async getNextData() {
    const searchParams = new URLSearchParams({
      key: KEY_API,
      q: this.searchQuery,
      image_type: 'photo',
      orientation: 'horizontal',
      safesearch: 'true',
      page: this.page,
      per_page: this.per_page,
    });

    const resp = await axios.get(`${BASE_URL}?${searchParams}`); 
    
    this.resultsQty = resp.data.totalHits;
    this.pagesQty = Math.ceil(this.resultsQty / this.per_page);
    
    return resp.data.hits;
  }
}
