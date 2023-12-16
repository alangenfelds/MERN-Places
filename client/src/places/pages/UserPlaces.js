import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

import LoadingSpinner from "../../shared/components/UIElements/LoadingSpinner";
import ErrorModal from "../../shared/components/UIElements/ErrorModal";
import PlaceList from "../components/PlaceList";
import { useHttpClient } from "../../shared/hooks/http-hook";

const UserPlaces = () => {
  const userId = useParams().userId;

  const { isLoading, error, sendRequest, clearError } = useHttpClient();
  const [userPlaces, setUserPlaces] = useState([]);

  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        const response = await sendRequest(
          `http://localhost:5000/api/places/user/${userId}`
        );

        setUserPlaces(response.places);
      } catch (err) {}
    };

    fetchPlaces();
  }, [sendRequest, userId]);

  const handleDeletePlace = (placeId) => {
    setUserPlaces((prevPlaces) => prevPlaces.filter((p) => p.id !== placeId));
  };

  return (
    <React.Fragment>
      {isLoading && <LoadingSpinner asOverlay />}
      <ErrorModal error={error} onClear={clearError} />
      {!isLoading && userPlaces.length > 0 && (
        <PlaceList items={userPlaces} onDeletePlace={handleDeletePlace} />
      )}
    </React.Fragment>
  );
};

export default UserPlaces;
