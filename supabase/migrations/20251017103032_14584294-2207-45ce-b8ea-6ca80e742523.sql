-- Add database-level length constraints for support_messages table

-- Add check constraint for message length (matching client validation of 1000 chars)
ALTER TABLE support_messages 
ADD CONSTRAINT message_length_check 
CHECK (char_length(message) <= 1000);

-- Add check constraint for name length
ALTER TABLE support_messages
ADD CONSTRAINT name_length_check
CHECK (char_length(name) <= 100);

-- Add check constraint for email length
ALTER TABLE support_messages
ADD CONSTRAINT email_length_check
CHECK (char_length(email) <= 255);