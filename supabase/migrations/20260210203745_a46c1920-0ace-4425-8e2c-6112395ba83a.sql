
-- Communication templates table for emails, WhatsApp, SMS at every stage
CREATE TABLE public.communication_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT 'general',
  channel TEXT NOT NULL DEFAULT 'email',
  subject TEXT,
  subject_ar TEXT,
  body TEXT NOT NULL,
  body_ar TEXT,
  variables TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.communication_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage communication templates"
  ON public.communication_templates FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Authenticated users can view active templates"
  ON public.communication_templates FOR SELECT
  USING (is_active = true AND auth.uid() IS NOT NULL);

CREATE TRIGGER update_communication_templates_updated_at
  BEFORE UPDATE ON public.communication_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default templates
INSERT INTO public.communication_templates (name, name_ar, slug, category, channel, subject, subject_ar, body, body_ar, variables) VALUES
('Company Registration Received', 'تم استلام تسجيل الشركة', 'company-registration-received', 'company', 'email', 'Your Company Registration Has Been Received', 'تم استلام تسجيل شركتكم', 'Dear {{company_name}}, your registration has been received and is under review. Your company number is {{company_number}}. We will notify you once your account is activated.', 'عزيزنا {{company_name}}، تم استلام تسجيلكم وهو قيد المراجعة. رقم شركتكم هو {{company_number}}. سنقوم بإبلاغكم عند تفعيل حسابكم.', ARRAY['company_name', 'company_number']),
('Company Registration Approved', 'تمت الموافقة على تسجيل الشركة', 'company-registration-approved', 'company', 'email', 'Your Company Account Has Been Activated', 'تم تفعيل حساب شركتكم', 'Dear {{company_name}}, your company account has been approved and activated. You can now access the Company Portal. Company Number: {{company_number}}.', 'عزيزنا {{company_name}}، تمت الموافقة على حساب شركتكم وتفعيله. يمكنكم الآن الوصول إلى بوابة الشركة. رقم الشركة: {{company_number}}.', ARRAY['company_name', 'company_number']),
('Sponsorship Invitation', 'دعوة رعاية', 'sponsorship-invitation', 'sponsorship', 'email', 'Sponsorship Invitation: {{event_name}}', 'دعوة رعاية: {{event_name}}', 'Dear {{company_name}}, you are invited to sponsor {{event_name}} on {{event_date}}. Package: {{package_name}}. Benefits: {{benefits}}.', 'عزيزنا {{company_name}}، تمت دعوتكم لرعاية {{event_name}} في {{event_date}}. الباقة: {{package_name}}. المزايا: {{benefits}}.', ARRAY['company_name', 'event_name', 'event_date', 'package_name', 'benefits']),
('Invoice Created', 'تم إنشاء فاتورة', 'invoice-created', 'financial', 'email', 'New Invoice #{{invoice_number}}', 'فاتورة جديدة #{{invoice_number}}', 'Dear {{company_name}}, a new invoice #{{invoice_number}} for {{amount}} {{currency}} has been created. Due date: {{due_date}}.', 'عزيزنا {{company_name}}، تم إنشاء فاتورة جديدة #{{invoice_number}} بمبلغ {{amount}} {{currency}}. تاريخ الاستحقاق: {{due_date}}.', ARRAY['company_name', 'invoice_number', 'amount', 'currency', 'due_date']),
('Order Confirmation', 'تأكيد الطلب', 'order-confirmation', 'orders', 'email', 'Order #{{order_number}} Confirmed', 'تأكيد الطلب #{{order_number}}', 'Dear {{company_name}}, your order #{{order_number}} has been confirmed. Total: {{amount}} {{currency}}.', 'عزيزنا {{company_name}}، تم تأكيد طلبكم #{{order_number}}. المبلغ الإجمالي: {{amount}} {{currency}}.', ARRAY['company_name', 'order_number', 'amount', 'currency']),
('Competition Registration', 'تسجيل في مسابقة', 'competition-registration', 'competition', 'email', 'Registration Confirmed: {{competition_name}}', 'تأكيد التسجيل: {{competition_name}}', 'Dear {{participant_name}}, you are registered for {{competition_name}} on {{date}}. Registration #: {{registration_number}}.', 'عزيزنا {{participant_name}}، تم تسجيلك في {{competition_name}} بتاريخ {{date}}. رقم التسجيل: {{registration_number}}.', ARRAY['participant_name', 'competition_name', 'date', 'registration_number']),
('Welcome New User', 'مرحباً بالمستخدم الجديد', 'welcome-user', 'general', 'email', 'Welcome to Altohaa', 'مرحباً بك في التوحة', 'Welcome {{full_name}}! Your account has been created. Account number: {{account_number}}.', 'مرحباً {{full_name}}! تم إنشاء حسابك. رقم الحساب: {{account_number}}.', ARRAY['full_name', 'account_number']);
