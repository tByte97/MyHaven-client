import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import axios from 'axios'; 
import { usePreferencesStore } from './stores/preferences';

import './assets/main.css'

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);


const token = localStorage.getItem('access_token');
if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

const preferences = usePreferencesStore(pinia);
if (token) {
    preferences.hydrateFromServer();
}

axios.interceptors.response.use(
    response => response,
    error => {
        if (error.response && error.response.status === 401 && localStorage.getItem('access_token')) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            router.push('/login');
        }
        return Promise.reject(error);
    }
);
    
app.mount('#app');
