import axios from "./axiosConfig";

export const rewardAPI = {
  getPoints: async () => {
    const res = await axios.get("/rewards/points");
    return res.data;
  },
  getOffers: async () => {
    const res = await axios.get("/rewards/offers");
    return res.data;
  },
  redeemOffer: async (offerId) => {
    const res = await axios.post(`/rewards/redeem/${offerId}`);
    return res.data;
  },
};
