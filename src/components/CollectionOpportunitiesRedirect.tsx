import React from 'react';
import { Navigate, useParams } from 'react-router-dom';

const CollectionOpportunitiesRedirect: React.FC = () => {
  const { collectionId } = useParams<{ collectionId: string }>();
  
  // Redirect from old route to new enhanced route
  return <Navigate to={`/collection/${collectionId}/manage`} replace />;
};

export default CollectionOpportunitiesRedirect;