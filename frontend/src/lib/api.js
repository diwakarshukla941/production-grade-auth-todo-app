import axios from "axios";
import { API_BASE_URL } from "@/config/api";

export const api = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    headers: {
        "Content-Type": "application/json",
    },
});

export const authHeaders = () => {
    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken) {
        return {};
    }

    return {
        Authorization: `Bearer ${accessToken}`,
    };
};
