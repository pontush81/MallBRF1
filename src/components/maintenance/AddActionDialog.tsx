import React, { useState, useMemo, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography,
  Chip, TextField, Autocomplete, Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { PlanRow } from '../../services/maintenancePlanService';
import { getSectionsAndSubsections, getActionSuggestions, ActionSuggestion } from './maintenancePlanHelpers';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AddActionDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (parentRowId: string, fields: Partial<PlanRow>, yearCol: string) => void;
  rows: PlanRow[];
  targetYear: string; // e.g. 'year_2027'
}

// ---------------------------------------------------------------------------
// localStorage keys
// ---------------------------------------------------------------------------

const LS_RECENT_SECTION = 'mp_recent_section';
const LS_RECENT_SUBSECTION = 'mp_recent_subsection';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format year column key to display label, e.g. 'year_2027' -> '2027' */
function yearLabel(yearCol: string): string {
  return yearCol.replace('year_', '');
}

/** Parse Swedish-formatted amount string to number. Handles spaces and comma decimal. */
function parseSwedishAmount(raw: string): number {
  const cleaned = raw.replace(/\s/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.round(num);
}

/** Format number as Swedish kr string for display */
function fmtKr(amount: number): string {
  if (!amount) return '';
  return amount.toLocaleString('sv-SE') + ' kr';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AddActionDialog({ open, onClose, onAdd, rows, targetYear }: AddActionDialogProps) {
  // Block 1: Sektion
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  // Block 2: Byggdel (subsection)
  const [selectedSubsectionId, setSelectedSubsectionId] = useState<string | null>(null);
  // Block 3: \u00c5tg\u00e4rd + Belopp
  const [atgardInput, setAtgardInput] = useState('');
  const [selectedSuggestion, setSelectedSuggestion] = useState<ActionSuggestion | null>(null);
  const [amountInput, setAmountInput] = useState('');

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------

  const sections = useMemo(() => getSectionsAndSubsections(rows), [rows]);

  const selectedSection = useMemo(
    () => sections.find(s => s.id === selectedSectionId) ?? null,
    [sections, selectedSectionId],
  );

  /** Action suggestions: when subsection is selected, show its matches first, then the rest */
  const suggestions = useMemo(() => {
    if (!selectedSubsectionId) return getActionSuggestions(rows);
    const filtered = getActionSuggestions(rows, selectedSubsectionId);
    const all = getActionSuggestions(rows);
    // De-dupe: filtered first, then remaining from all
    const seen = new Set(filtered.map(s => `${s.atgard}|${s.byggdel}`));
    const rest = all.filter(s => !seen.has(`${s.atgard}|${s.byggdel}`));
    return [...filtered, ...rest];
  }, [rows, selectedSubsectionId]);

  // Recent values from localStorage
  const recentSectionId = useMemo(() => {
    try { return localStorage.getItem(LS_RECENT_SECTION); } catch { return null; }
  }, [open]); // re-read when dialog opens

  const recentSubsectionId = useMemo(() => {
    try { return localStorage.getItem(LS_RECENT_SUBSECTION); } catch { return null; }
  }, [open]);

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  const isValid = Boolean(selectedSectionId && selectedSubsectionId && atgardInput.trim());

  // ---------------------------------------------------------------------------
  // Reset on open
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!open) return;

    // Pre-select recent section if it still exists
    const sectionExists = recentSectionId && sections.some(s => s.id === recentSectionId);
    const preSection = sectionExists ? recentSectionId : null;
    setSelectedSectionId(preSection);

    // Pre-select recent subsection if parent section matches and it still exists
    if (preSection) {
      const section = sections.find(s => s.id === preSection);
      const subExists = recentSubsectionId && section?.subsections.some(ss => ss.id === recentSubsectionId);
      setSelectedSubsectionId(subExists ? recentSubsectionId : null);
    } else {
      setSelectedSubsectionId(null);
    }

    // Always reset action fields
    setAtgardInput('');
    setSelectedSuggestion(null);
    setAmountInput('');
  }, [open, sections, recentSectionId, recentSubsectionId]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleSelectSection = (sectionId: string) => {
    setSelectedSectionId(sectionId);
    setSelectedSubsectionId(null); // reset downstream
    setSelectedSuggestion(null);
    try { localStorage.setItem(LS_RECENT_SECTION, sectionId); } catch { /* ignore */ }
  };

  const handleSelectSubsection = (subsectionId: string) => {
    setSelectedSubsectionId(subsectionId);
    setSelectedSuggestion(null);
    try { localStorage.setItem(LS_RECENT_SUBSECTION, subsectionId); } catch { /* ignore */ }
  };

  const handleSuggestionSelect = (_event: React.SyntheticEvent, value: string | ActionSuggestion | null) => {
    if (value === null) {
      // Cleared
      setSelectedSuggestion(null);
      setAtgardInput('');
      setAmountInput('');
      return;
    }

    if (typeof value === 'string') {
      // Free text (freeSolo)
      setSelectedSuggestion(null);
      setAtgardInput(value);
      return;
    }

    // Existing suggestion selected (Genv\u00e4g B): auto-fill everything
    setSelectedSuggestion(value);
    setAtgardInput(value.atgard);
    setAmountInput(value.amount ? String(value.amount) : '');

    // Auto-select section + subsection from the suggestion
    if (value.sectionId) {
      setSelectedSectionId(value.sectionId);
      try { localStorage.setItem(LS_RECENT_SECTION, value.sectionId); } catch { /* ignore */ }
    }
    if (value.subsectionId) {
      setSelectedSubsectionId(value.subsectionId);
      try { localStorage.setItem(LS_RECENT_SUBSECTION, value.subsectionId); } catch { /* ignore */ }
    }
  };

  const handleAtgardInputChange = (_event: React.SyntheticEvent, value: string) => {
    setAtgardInput(value);
  };

  const handleAdd = () => {
    if (!isValid || !selectedSubsectionId) return;

    const parsedAmount = parseSwedishAmount(amountInput);

    const fields: Partial<PlanRow> = {
      atgard: atgardInput.trim(),
      byggdel: selectedSuggestion?.byggdel ?? '',
      tek_livslangd: selectedSuggestion?.tek_livslangd ?? '',
      utredningspunkter: selectedSuggestion?.utredningspunkter ?? '',
    };

    // Set the target year amount dynamically
    (fields as Record<string, unknown>)[targetYear] = parsedAmount || null;

    onAdd(selectedSubsectionId, fields, targetYear);
    onClose();
  };

  // ---------------------------------------------------------------------------
  // Sorting helpers: put recent items first
  // ---------------------------------------------------------------------------

  const sortedSections = useMemo(() => {
    if (!recentSectionId) return sections;
    const recent = sections.filter(s => s.id === recentSectionId);
    const rest = sections.filter(s => s.id !== recentSectionId);
    return [...recent, ...rest];
  }, [sections, recentSectionId]);

  const sortedSubsections = useMemo(() => {
    if (!selectedSection) return [];
    const subs = selectedSection.subsections;
    if (!recentSubsectionId) return subs;
    const recent = subs.filter(s => s.id === recentSubsectionId);
    const rest = subs.filter(s => s.id !== recentSubsectionId);
    return [...recent, ...rest];
  }, [selectedSection, recentSubsectionId]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const block2Disabled = !selectedSectionId;
  const block3Disabled = !selectedSubsectionId;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{`L\u00e4gg till \u00e5tg\u00e4rd i ${yearLabel(targetYear)}`}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          {/* ---- Block 1: Sektion ---- */}
          <Typography variant="subtitle2" gutterBottom>
            Sektion
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {sortedSections.map((section) => {
              const isRecent = section.id === recentSectionId;
              const isSelected = section.id === selectedSectionId;
              return (
                <Chip
                  key={section.id}
                  label={section.label}
                  onClick={() => handleSelectSection(section.id)}
                  color={isSelected ? 'primary' : 'default'}
                  variant={isSelected ? 'filled' : 'outlined'}
                  sx={{
                    borderColor: isRecent && !isSelected ? 'primary.main' : undefined,
                    borderWidth: isRecent && !isSelected ? 2 : undefined,
                  }}
                />
              );
            })}
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* ---- Block 2: Byggdel (subsection) ---- */}
          <Box
            sx={{
              opacity: block2Disabled ? 0.4 : 1,
              pointerEvents: block2Disabled ? 'none' : 'auto',
              transition: 'opacity 0.2s',
            }}
          >
            <Typography variant="subtitle2" gutterBottom>
              Byggdel
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {sortedSubsections.map((sub) => {
                const isRecent = sub.id === recentSubsectionId;
                const isSelected = sub.id === selectedSubsectionId;
                return (
                  <Chip
                    key={sub.id}
                    label={sub.label}
                    onClick={() => handleSelectSubsection(sub.id)}
                    color={isSelected ? 'primary' : 'default'}
                    variant={isSelected ? 'filled' : 'outlined'}
                    sx={{
                      borderColor: isRecent && !isSelected ? 'primary.main' : undefined,
                      borderWidth: isRecent && !isSelected ? 2 : undefined,
                    }}
                  />
                );
              })}
              {!block2Disabled && sortedSubsections.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  Inga byggdelar i denna sektion.
                </Typography>
              )}
            </Box>
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* ---- Block 3: \u00c5tg\u00e4rd + Belopp ---- */}
          <Box
            sx={{
              opacity: block3Disabled ? 0.4 : 1,
              pointerEvents: block3Disabled ? 'none' : 'auto',
              transition: 'opacity 0.2s',
            }}
          >
            <Typography variant="subtitle2" gutterBottom>
              {'\u00c5tg\u00e4rd'}
            </Typography>

            <Autocomplete<ActionSuggestion, false, false, true>
              freeSolo
              options={suggestions}
              getOptionLabel={(option) =>
                typeof option === 'string' ? option : option.atgard
              }
              inputValue={atgardInput}
              onInputChange={handleAtgardInputChange}
              onChange={handleSuggestionSelect}
              filterOptions={(options, state) => {
                const input = state.inputValue.toLowerCase();
                if (!input) return options;
                return options.filter(
                  (o) =>
                    o.atgard.toLowerCase().includes(input) ||
                    o.byggdel.toLowerCase().includes(input),
                );
              }}
              renderOption={(props, option) => (
                <li {...props} key={`${option.atgard}|${option.byggdel}`}>
                  <Box sx={{ py: 0.5 }}>
                    <Typography variant="body2" fontWeight={600}>
                      {option.atgard}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        {option.byggdel}
                      </Typography>
                      {option.latestYear && (
                        <Typography variant="caption" color="text.secondary">
                          Senast: {option.latestYear}
                        </Typography>
                      )}
                      {option.amount > 0 && (
                        <Typography variant="caption" color="text.secondary">
                          {fmtKr(option.amount)}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={'\u00c5tg\u00e4rd'}
                  placeholder={`S\u00f6k eller skriv ny \u00e5tg\u00e4rd...`}
                  size="small"
                  fullWidth
                />
              )}
              sx={{ mb: 2 }}
            />

            {/* Suggestion info line */}
            {selectedSuggestion && (
              <Typography variant="body2" color="primary" sx={{ mb: 2 }}>
                {`Skapar ny \u00e5tg\u00e4rd baserad p\u00e5: ${selectedSuggestion.atgard} \u2013 ${selectedSuggestion.byggdel}${selectedSuggestion.latestYear ? ` (${selectedSuggestion.latestYear})` : ''}`}
              </Typography>
            )}

            {/* Amount */}
            <TextField
              label={`Belopp ${yearLabel(targetYear)} (kr)`}
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              size="small"
              fullWidth
              placeholder="t.ex. 25 000"
              inputProps={{ inputMode: 'numeric' }}
            />
          </Box>
        </Box>
      </DialogContent>

      {/* ---- Footer ---- */}
      <DialogActions>
        <Button onClick={onClose}>Avbryt</Button>
        <Button
          onClick={handleAdd}
          variant="contained"
          startIcon={<AddIcon />}
          disabled={!isValid}
        >
          {`L\u00e4gg till i ${yearLabel(targetYear)}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
