const getTrueLayerUrls = () => {
  if (process.env.TRUELAYER_ENV === 'prod') {
    return {
      auth: 'https://auth.truelayer.com',
      api: 'https://api.truelayer.com',
    };
  }

  return {
    auth: 'https://auth.truelayer-sandbox.com',
    api: 'https://api.truelayer-sandbox.com',
  };
};

export default getTrueLayerUrls;
