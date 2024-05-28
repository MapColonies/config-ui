import axios from 'axios';

const CONFIG_SERVER_URL = '/api';

export const createServerApi = () => {
  return axios.create({
    baseURL: CONFIG_SERVER_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};
