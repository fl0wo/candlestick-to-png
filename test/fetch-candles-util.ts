import axios from 'axios';

export const fetchCandles = async (asset: string, startMillis: number) => {
  const data = JSON.stringify({
    startMillis: startMillis,
    crypto: asset
  });

  const config = {
    method: 'post',
    url: 'https://gl7tbiubw5.execute-api.eu-west-1.amazonaws.com/dev/candles',
    headers: {
      'Content-Type': 'application/json'
    },
    data: data
  };

  try{
    return await axios(config)
  }catch (e) {
    console.error(e)
    return Promise.resolve(null)
  }
}

