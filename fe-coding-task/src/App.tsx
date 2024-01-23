import React, { useEffect, useState } from 'react';
import './App.css';
import axios from 'axios';
import { Button, FormControl, Grid, InputLabel, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

type Variable = { 
  code?: string,
  text?: string,
  values: string[],
  valueTexts: string[],
  elimination?: boolean
};

type FilterObj = {
  code: string,
  selection: {
    filter: 'item',
    values: string[]
  }
};

type Storage = { tid: string[], boligtype: string | undefined, contentscode: string | undefined }[]

function App() {
  const [data, setData] = useState<any>();
  const [loading, setLoading] = useState<Boolean>(true);
  const [error, setError] = useState<Error>();
  const [boligtypes, setBoligtypes] = useState<Variable>({ values: [], valueTexts: [] });
  const [contentscodes, setContentscodes] = useState<Variable>({ values: [], valueTexts: [] });
  const [tids, setTids] = useState<Variable>({ values: [], valueTexts: [] });
  const [boligtype, setBoligtype] = useState<string>();
  const [contentscode, setContentscode] = useState<string>();
  const [tid, setTid] = useState<string[]>([]);

  useEffect(() => {
    axios.get('https://data.ssb.no/api/v0/en/table/07241')
      .then(({ data }) => {
        const { variables } = data;
        setBoligtypes(variables[0]);
        setContentscodes(variables[1]);
        setTids(variables[2]);
      })
      .catch((error) => {
        setError(error);
        setLoading(false);
      })
  }, []);

  useEffect(() => {
    const query: { query: FilterObj[] } = {
      query: []
    };
    if (boligtype) {
      query.query.push({
        code: 'Boligtype',
        selection: {
          filter: 'item',
          values: [boligtype]
        }
      })
    }
    if (contentscode) {
      query.query.push({
        code: 'ContentsCode',
        selection: {
          filter: 'item',
          values: [contentscode]
        }
      })
    }
    if (tid.length) {
      query.query.push({
        code: 'Tid',
        selection: {
          filter: 'item',
          values: tid
        }
      })
    }
    axios.post('https://data.ssb.no/api/v0/en/table/07241', JSON.stringify(query))
      .then(({ data }) => {
        setData(data);
        setLoading(false);
      })
      .catch((error) => {
        setError(error);
        setLoading(false);
      })
  }, [boligtype, contentscode, tid?.length]);

  const changeBoligtype = (event: SelectChangeEvent) => {
    setBoligtype(event.target.value as string);
  }
  const changeContentscode = (event: SelectChangeEvent) => {
    setContentscode(event.target.value as string);
  }
  const changeTid = (event: SelectChangeEvent) => {
    setTid(event.target.value as unknown as string[]);
  }

  const rememberStateInLocalStorage = () => {
    const storage: Storage = JSON.parse(localStorage.getItem('storage') || "[]")
    storage.push({ tid, boligtype, contentscode })
    localStorage.setItem('storage', JSON.stringify(storage))
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  const sxProps = { minWidth: 120, mb: 2 };

  return (
    <Grid container spacing={2}>
      <Grid item xs={3} sx={sxProps}>
        <FormControl fullWidth>
          <InputLabel id="Boligtype">Type of dwelling</InputLabel>
          <Select labelId="Boligtype" label="Type of dwelling" value={boligtype} onChange={changeBoligtype}>
            {boligtypes.values.map((va: string, i: number) => <MenuItem value={va}>{boligtypes.valueTexts[i]}</MenuItem>)}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={3} sx={sxProps}>
        <FormControl fullWidth>
          <InputLabel id="ContentsCode">Contents</InputLabel>
          <Select labelId="ContentsCode" label="Contents" value={contentscode} onChange={changeContentscode}>
            {contentscodes.values.map((va: string, i: number) => <MenuItem value={va}>{contentscodes.valueTexts[i]}</MenuItem>)}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={3} sx={sxProps}>
        <FormControl fullWidth>
          <InputLabel id="Tid">Quarter</InputLabel>
          {/* @ts-ignore */}
          <Select labelId="Tid" label="Quarter" value={tid} onChange={changeTid} multiple>
            {tids.values.map((va: string, i: number) => <MenuItem value={va}>{tids.valueTexts[i]}</MenuItem>)}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={3} sx={sxProps}>
        <Button variant="outlined" onClick={rememberStateInLocalStorage}>Save search</Button>
      </Grid>
      <Grid item xs={12}>
      <HighchartsReact
        highcharts={Highcharts}
        options={{
          chart: {
            type: 'spline'
          },
          series: [{
            name: 'All data pointlessly combined',
            data: data?.value || []
          }],
          xAxis: [{
            categories: Object.keys(data?.dimension.Tid.category.index)
          }]
        }}></HighchartsReact>
      </Grid>
    </Grid>
  );
}

export default App;
