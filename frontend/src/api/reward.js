import axios from "./axiosConfig";

export const rewardAPI = {
  getPoints: async () => {
    const res = await axios.get("/rewards/points");
    return res.data;
  }
};
