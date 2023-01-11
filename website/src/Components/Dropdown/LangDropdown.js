import React from 'react';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';

var languages = [
    "Abaza (abq)",
    "Adyghe (ady)",
    "Afrikaans (af)",
    "Angika (ang)",
    "Arabic (ar)",
    "Assamese (as)",
    "Avar (ava)",
    "Azerbaijani (az)",
    "Belarusian (be)",
    "Bulgarian (bg)",
    "Bihari (bh)",
    "Bhojpuri (bho)",
    "Bengali (bn)",
    "Bosnian (bs)",
    "Simplified Chinese (ch_sim)",
    "Traditional Chinese (ch_tra)",
    "Chechen (che)",
    "Czech (cs)",
    "Welsh (cy)",
    "Danish (da)",
    "Dargwa (dar)",
    "German (de)",
    "English (en)",
    "Spanish (es)",
    "Estonian (et)",
    "Persian (Farsi) (fa)",
    "French (fr)",
    "Irish (ga)",
    "Goan Konkani (gom)",
    "Hindi (hi)",
    "Croatian (hr)",
    "Hungarian (hu)",
    "Indonesian (id)",
    "Ingush (inh)",
    "Icelandic (is)",
    "Italian (it)",
    "Japanese (ja)",
    "Kabardian (kbd)",
    "Kannada (kn)",
    "Korean (ko)",
    "Kurdish (ku)",
    "Latin (la)",
    "Lak (lbe)",
    "Lezghian (lez)",
    "Lithuanian (lt)",
    "Latvian (lv)",
    "Magahi (mah)",
    "Maithili (mai)",
    "Maori (mi)",
    "Mongolian (mn)",
    "Marathi (mr)",
    "Malay (ms)",
    "Maltese (mt)",
    "Nepali (ne)",
    "Newari (new)",
    "Dutch (nl)",
    "Norwegian (no)",
    "Occitan (oc)",
    "Pali (pi)",
    "Polish (pl)",
    "Portuguese (pt)",
    "Romanian (ro)",
    "Russian (ru)",
    "Serbian (cyrillic) (rs_cyrillic)",
    "Serbian (latin) (rs_latin)",
    "Nagpuri (sck)",
    "Slovak (sk)",
    "Slovenian (sl)",
    "Albanian (sq)",
    "Swedish (sv)",
    "Swahili (sw)",
    "Tamil (ta)",
    "Tabassaran (tab)",
    "Telugu (te)",
    "Thai (th)",
    "Tajik (tjk)",
    "Tagalog (tl)",
    "Turkish (tr)",
    "Uyghur (ug)",
    "Ukranian (uk)",
    "Urdu (ur)",
    "Uzbek (uz)",
    "Vietnamese (vi)"
]

export default class LangDropdown extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
      choice: 'Portuguese (pt)'
    }

    this.getChoice = this.getChoice.bind(this);
  }

  setVisible() {
    this.setState({ visible: true });
  }

  setInvisible() {
    this.setState({ visible: false });
  }

  getChoice() {
    return this.state.choice;
  }

  changeLanguage = (event) => {
    this.setState({ choice: event.target.value });
  }

  render() {
    return (
      <div>
        {
          this.state.visible && <Box sx={{ minWidth: 140, mt: '0.5rem'}}>
            <FormControl fullWidth size="small">
              <InputLabel id="demo-simple-select-label">Language</InputLabel>
              <Select
                labelId="demo-simple-select-label"
                id="demo-simple-select"
                value={this.state.choice}
                label="Algorithm"
                onChange={this.changeLanguage}
              >
                {languages.map((language) => {
                    return <MenuItem key={language} value={language}>{language}</MenuItem>
                })}
              </Select>
            </FormControl>
          </Box>
        }
      </div>
    );
  }
}