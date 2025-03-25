
-- Add custom document processing functions
CREATE OR REPLACE FUNCTION get_pending_documents()
RETURNS SETOF JSONB AS $$
BEGIN
  RETURN QUERY
  SELECT 
    jsonb_build_object(
      'id', doc.id,
      'client_id', doc.client_id,
      'document_name', COALESCE(doc.document_name, doc.name, 'Unnamed Document'),
      'document_url', COALESCE(doc.document_url, doc.url),
      'status', doc.status,
      'created_at', doc.created_at
    )
  FROM document_processing_jobs doc
  WHERE doc.status = 'pending'
  ORDER BY doc.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get a document by ID
CREATE OR REPLACE FUNCTION get_document_by_id(document_id_param TEXT)
RETURNS JSONB AS $$
DECLARE
  doc_record JSONB;
BEGIN
  SELECT 
    jsonb_build_object(
      'id', doc.id,
      'client_id', doc.client_id,
      'document_name', COALESCE(doc.document_name, doc.name, 'Unnamed Document'),
      'document_url', COALESCE(doc.document_url, doc.url),
      'document_type', doc.document_type,
      'status', doc.status,
      'created_at', doc.created_at,
      'error', doc.error,
      'name', doc.document_name,
      'url', doc.document_url
    )
  INTO doc_record
  FROM document_processing_jobs doc
  WHERE doc.id::TEXT = document_id_param;
  
  RETURN doc_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update document status
CREATE OR REPLACE FUNCTION update_document_status(
  document_id_param TEXT,
  status_param TEXT,
  error_message_param TEXT DEFAULT NULL,
  processed_at_param TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE document_processing_jobs
  SET 
    status = status_param,
    error = error_message_param,
    updated_at = CURRENT_TIMESTAMP
  WHERE id::TEXT = document_id_param;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log client activity
CREATE OR REPLACE FUNCTION log_client_activity(
  client_id_param UUID,
  activity_type_param TEXT,
  description_param TEXT,
  metadata_param JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB AS $$
DECLARE
  inserted_record JSONB;
BEGIN
  -- Insert the activity record
  INSERT INTO client_activities (
    client_id,
    activity_type,
    description,
    metadata,
    created_at,
    updated_at
  )
  VALUES (
    client_id_param,
    activity_type_param::activity_type_enum,
    description_param,
    metadata_param,
    NOW(),
    NOW()
  )
  RETURNING jsonb_build_object(
    'id', id,
    'client_id', client_id,
    'activity_type', activity_type,
    'description', description,
    'metadata', metadata,
    'created_at', created_at
  ) INTO inserted_record;
  
  RETURN inserted_record;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Error in log_client_activity: %', SQLERRM;
    RETURN jsonb_build_object(
      'error', SQLERRM,
      'success', false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get client activities
CREATE OR REPLACE FUNCTION get_client_activities(
  client_id_param UUID,
  limit_param INTEGER DEFAULT 10
)
RETURNS SETOF JSONB AS $$
BEGIN
  RETURN QUERY
  SELECT 
    jsonb_build_object(
      'id', act.id,
      'client_id', act.client_id,
      'activity_type', act.activity_type,
      'activity_description', act.description,
      'created_at', act.created_at,
      'client_name', COALESCE(agents.client_name, 'Unknown Client'),
      'activity_metadata', act.metadata
    )
  FROM client_activities act
  LEFT JOIN ai_agents agents ON act.client_id = agents.client_id
  WHERE 
    act.client_id = client_id_param
    AND agents.interaction_type = 'config'
  ORDER BY act.created_at DESC
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all activities
CREATE OR REPLACE FUNCTION get_all_activities(
  limit_param INTEGER DEFAULT 50
)
RETURNS SETOF JSONB AS $$
BEGIN
  RETURN QUERY
  SELECT 
    jsonb_build_object(
      'id', act.id,
      'client_id', act.client_id,
      'activity_type', act.activity_type,
      'activity_description', act.description,
      'created_at', act.created_at,
      'client_name', COALESCE(agents.client_name, 'Unknown Client'),
      'activity_metadata', act.metadata
    )
  FROM client_activities act
  LEFT JOIN ai_agents agents ON act.client_id = agents.client_id
  WHERE agents.interaction_type = 'config'
  ORDER BY act.created_at DESC
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
