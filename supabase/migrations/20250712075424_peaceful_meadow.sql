/*
  # Amélioration du système de maintenance préventive

  1. Nouvelles Fonctionnalités
    - Ajout de seuils d'alerte pour les maintenances
    - Ajout d'un champ pour le seuil d'alerte en pourcentage
    - Ajout d'un champ pour les pièces nécessaires à la maintenance
    - Ajout d'un champ pour le coût estimé de la maintenance
  
  2. Améliorations
    - Ajout d'une fonction pour calculer le pourcentage d'utilisation avant maintenance
    - Ajout d'une vue pour les maintenances à prévoir
    - Amélioration des triggers pour mettre à jour automatiquement les prochaines maintenances
*/

-- Ajout de champs pour améliorer le suivi des maintenances
ALTER TABLE maintenance_types ADD COLUMN IF NOT EXISTS seuil_alerte_pourcentage INTEGER DEFAULT 80;
ALTER TABLE maintenance_types ADD COLUMN IF NOT EXISTS pieces_necessaires TEXT[];
ALTER TABLE maintenance_types ADD COLUMN IF NOT EXISTS cout_estime NUMERIC(10,2) DEFAULT 0;
ALTER TABLE maintenance_types ADD COLUMN IF NOT EXISTS temps_estime_heures NUMERIC(5,2) DEFAULT 1;

-- Ajout de champs pour le suivi des maintenances effectuées
ALTER TABLE maintenances ADD COLUMN IF NOT EXISTS pieces_utilisees TEXT[];
ALTER TABLE maintenances ADD COLUMN IF NOT EXISTS temps_reel_heures NUMERIC(5,2);
ALTER TABLE maintenances ADD COLUMN IF NOT EXISTS kilometrage NUMERIC(10,2);
ALTER TABLE maintenances ADD COLUMN IF NOT EXISTS observations TEXT;

-- Création d'une fonction pour calculer le pourcentage d'utilisation avant maintenance
CREATE OR REPLACE FUNCTION calculate_maintenance_percentage(
  current_hours NUMERIC,
  next_maintenance_hours NUMERIC
) RETURNS NUMERIC AS $$
BEGIN
  IF next_maintenance_hours IS NULL OR next_maintenance_hours = 0 THEN
    RETURN NULL;
  END IF;
  
  RETURN ROUND((current_hours / next_maintenance_hours) * 100);
END;
$$ LANGUAGE plpgsql;

-- Création d'une vue pour les maintenances à prévoir
CREATE OR REPLACE VIEW maintenances_a_prevoir AS
SELECT 
  m.id AS materiel_id,
  m.nom AS materiel_nom,
  m.type AS materiel_type,
  m.machine_hours AS heures_actuelles,
  m.next_maintenance_hours AS heures_prochaine_maintenance,
  calculate_maintenance_percentage(m.machine_hours, m.next_maintenance_hours) AS pourcentage_utilisation,
  m.prochaine_maintenance AS date_prochaine_maintenance,
  mt.id AS type_maintenance_id,
  mt.nom AS type_maintenance_nom,
  mt.intervalle_heures,
  mt.seuil_alerte_pourcentage,
  mt.cout_estime,
  CASE 
    WHEN m.machine_hours >= m.next_maintenance_hours THEN 'urgent'
    WHEN calculate_maintenance_percentage(m.machine_hours, m.next_maintenance_hours) >= mt.seuil_alerte_pourcentage THEN 'alerte'
    WHEN m.prochaine_maintenance <= CURRENT_DATE + INTERVAL '7 days' THEN 'planifier'
    ELSE 'normal'
  END AS statut_maintenance
FROM 
  materiel m
LEFT JOIN 
  maintenance_types mt ON mt.id = (
    SELECT id FROM maintenance_types 
    WHERE (intervalle_heures IS NOT NULL AND intervalle_heures > 0)
    ORDER BY priorite DESC, intervalle_heures ASC
    LIMIT 1
  )
WHERE 
  m.statut != 'hors_service'
  AND (
    (m.next_maintenance_hours IS NOT NULL AND m.machine_hours >= m.next_maintenance_hours * (mt.seuil_alerte_pourcentage / 100.0))
    OR (m.prochaine_maintenance IS NOT NULL AND m.prochaine_maintenance <= CURRENT_DATE + INTERVAL '30 days')
  );

-- Amélioration de la fonction pour mettre à jour le matériel après une maintenance
CREATE OR REPLACE FUNCTION update_materiel_after_maintenance()
RETURNS TRIGGER AS $$
DECLARE
  maintenance_type_record RECORD;
  new_next_maintenance_hours NUMERIC;
BEGIN
  -- Si la maintenance passe à "terminée"
  IF NEW.statut = 'terminee' AND OLD.statut != 'terminee' THEN
    -- Récupérer les informations du type de maintenance
    SELECT * INTO maintenance_type_record FROM maintenance_types WHERE id = NEW.type_id;
    
    -- Mettre à jour le matériel
    IF maintenance_type_record.intervalle_heures IS NOT NULL AND maintenance_type_record.intervalle_heures > 0 THEN
      -- Calculer la prochaine maintenance basée sur les heures machine actuelles
      IF NEW.heures_machine_fin IS NOT NULL THEN
        new_next_maintenance_hours := NEW.heures_machine_fin + maintenance_type_record.intervalle_heures;
      ELSE
        -- Récupérer les heures machine actuelles si non fournies
        SELECT machine_hours INTO NEW.heures_machine_fin FROM materiel WHERE id = NEW.materiel_id;
        new_next_maintenance_hours := NEW.heures_machine_fin + maintenance_type_record.intervalle_heures;
      END IF;
      
      -- Mettre à jour le matériel avec les nouvelles heures machine et la prochaine maintenance
      UPDATE materiel 
      SET 
        machine_hours = NEW.heures_machine_fin,
        next_maintenance_hours = new_next_maintenance_hours,
        prochaine_maintenance = CURRENT_DATE + (maintenance_type_record.intervalle_jours || ' days')::INTERVAL,
        statut = 'disponible'
      WHERE id = NEW.materiel_id;
    ELSE
      -- Si pas d'intervalle d'heures, mettre à jour uniquement le statut
      UPDATE materiel 
      SET 
        statut = 'disponible',
        prochaine_maintenance = CURRENT_DATE + (maintenance_type_record.intervalle_jours || ' days')::INTERVAL
      WHERE id = NEW.materiel_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour vérifier si une maintenance est nécessaire
CREATE OR REPLACE FUNCTION is_maintenance_needed(
  materiel_id UUID,
  type_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  materiel_record RECORD;
  maintenance_type_record RECORD;
  last_maintenance_date DATE;
  last_maintenance_hours NUMERIC;
BEGIN
  -- Récupérer les informations du matériel
  SELECT * INTO materiel_record FROM materiel WHERE id = materiel_id;
  
  -- Si pas de type spécifié, prendre le premier type applicable
  IF type_id IS NULL THEN
    SELECT * INTO maintenance_type_record FROM maintenance_types 
    WHERE (intervalle_heures IS NOT NULL AND intervalle_heures > 0)
    ORDER BY priorite DESC, intervalle_heures ASC
    LIMIT 1;
  ELSE
    SELECT * INTO maintenance_type_record FROM maintenance_types WHERE id = type_id;
  END IF;
  
  -- Si pas de type trouvé, retourner false
  IF maintenance_type_record IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Récupérer la dernière maintenance de ce type
  SELECT 
    date_execution, 
    heures_machine_fin 
  INTO 
    last_maintenance_date, 
    last_maintenance_hours 
  FROM maintenances 
  WHERE 
    materiel_id = materiel_record.id 
    AND type_id = maintenance_type_record.id 
    AND statut = 'terminee'
  ORDER BY date_execution DESC 
  LIMIT 1;
  
  -- Vérifier si une maintenance est nécessaire basée sur les heures
  IF maintenance_type_record.intervalle_heures IS NOT NULL 
     AND materiel_record.machine_hours IS NOT NULL 
     AND last_maintenance_hours IS NOT NULL THEN
    
    IF (materiel_record.machine_hours - last_maintenance_hours) >= maintenance_type_record.intervalle_heures THEN
      RETURN TRUE;
    END IF;
  END IF;
  
  -- Vérifier si une maintenance est nécessaire basée sur les jours
  IF maintenance_type_record.intervalle_jours IS NOT NULL 
     AND last_maintenance_date IS NOT NULL THEN
    
    IF (CURRENT_DATE - last_maintenance_date) >= maintenance_type_record.intervalle_jours THEN
      RETURN TRUE;
    END IF;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Créer une fonction pour calculer les heures d'utilisation depuis la dernière maintenance
CREATE OR REPLACE FUNCTION get_hours_since_last_maintenance(
  materiel_id UUID,
  type_id UUID DEFAULT NULL
) RETURNS NUMERIC AS $$
DECLARE
  last_maintenance_hours NUMERIC;
  current_hours NUMERIC;
BEGIN
  -- Récupérer les heures machine actuelles
  SELECT machine_hours INTO current_hours FROM materiel WHERE id = materiel_id;
  
  -- Récupérer les heures de la dernière maintenance
  SELECT heures_machine_fin INTO last_maintenance_hours 
  FROM maintenances 
  WHERE 
    materiel_id = materiel_id 
    AND (type_id IS NULL OR type_id = type_id)
    AND statut = 'terminee'
  ORDER BY date_execution DESC 
  LIMIT 1;
  
  -- Si pas de maintenance précédente, retourner les heures actuelles
  IF last_maintenance_hours IS NULL THEN
    RETURN current_hours;
  END IF;
  
  RETURN current_hours - last_maintenance_hours;
END;
$$ LANGUAGE plpgsql;