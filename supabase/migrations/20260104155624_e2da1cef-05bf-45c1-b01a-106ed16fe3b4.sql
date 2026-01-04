-- Add admin CRUD policies for packages table
CREATE POLICY "Admins can insert packages" 
ON public.packages 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update packages" 
ON public.packages 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete packages" 
ON public.packages 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));