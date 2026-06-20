import { useState } from "react";


function useGetLocation(setFormData, setErrors) {
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);
    const [locationStatus, setLocationStatus] = useState("");

    const getGeolocation = () => {
        setIsLoadingLocation(true);
        setLocationStatus("Detecting your location...");

        return new Promise((resolve, reject) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;

                        fetch(
                            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                        )
                            .then((response) => response.json())
                            .then((data) => {
                                const locationName =
                                    data.display_name ||
                                    `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
                                const detectedCity =
                                    data.address?.city ||
                                    data.address?.town ||
                                    data.address?.village ||
                                    data.address?.county ||
                                    data.address?.state_district ||
                                    "";
                                const locationData = {
                                    serviceAreas: locationName,
                                    city: detectedCity,
                                    location: {
                                        type: "Point",
                                        coordinates: [longitude, latitude],
                                    },
                                };

                                setFormData((prev) => ({
                                    ...prev,
                                    ...locationData,
                                }));

                                setLocationStatus("Location detected successfully!");
                                setIsLoadingLocation(false);
                                setErrors((prev) => ({ ...prev, serviceAreas: null }));
                                resolve(locationData);
                            })
                            .catch(() => {
                                const fallbackLocationData = {
                                    serviceAreas: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
                                    city: "",
                                    location: {
                                        type: "Point",
                                        coordinates: [longitude, latitude],
                                    },
                                };

                                setFormData((prev) => ({
                                    ...prev,
                                    ...fallbackLocationData,
                                }));
                                setLocationStatus("Got coordinates, but couldn't get address.");
                                setIsLoadingLocation(false);
                                resolve(fallbackLocationData);
                            });
                    },
                    (error) => {
                        let errorMessage = "Failed to get your location.";
                        if (error.code === 1) {
                            errorMessage =
                                "Location access denied. Please enable location services.";
                        } else if (error.code === 2) {
                            errorMessage = "Location unavailable. Please try again.";
                        } else if (error.code === 3) {
                            errorMessage = "Location request timed out. Please try again.";
                        }
                        setLocationStatus(errorMessage);
                        setIsLoadingLocation(false);
                        setErrors((prev) => ({ ...prev, serviceAreas: errorMessage }));
                        reject(new Error(errorMessage));
                    },
                    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
                );
            } else {
                const errorMessage = "Geolocation is not supported by this browser.";
                setLocationStatus(errorMessage);
                setIsLoadingLocation(false);
                setErrors((prev) => ({
                    ...prev,
                    serviceAreas: "Geolocation not supported by your browser.",
                }));
                reject(new Error(errorMessage));
            }
        });
    };

    return { getGeolocation, isLoadingLocation, locationStatus };
}

export default useGetLocation;
