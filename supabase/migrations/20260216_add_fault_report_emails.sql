-- Migration: Add fault_report_emails column to notification_settings
-- Date: 2026-02-16
-- Description: Allow multiple email recipients for fault report notifications

ALTER TABLE notification_settings
ADD COLUMN IF NOT EXISTS fault_report_emails TEXT[] DEFAULT '{}';
