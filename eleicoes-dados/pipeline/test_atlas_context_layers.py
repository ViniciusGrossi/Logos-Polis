import unittest
from atlas_context_layers import aggregate_aggressions, parse_gdp, mortality_rate, sim_rows
import io


class ContextLayersTests(unittest.TestCase):
    def test_headerless_sim_uses_validated_official_schema_and_retains_first_record(self):
        names=['ORIGEM','TIPOBITO','DTOBITO','CODMUNRES','CAUSABAS']
        rows=list(sim_rows(io.StringIO('1;2;01-01-2022;310620;X950\n1;2;02-01-2022;355030;Y099\n'),names))
        self.assertEqual(len(rows),2)
        self.assertEqual(rows[0]['CODMUNRES'],'310620')
        with self.assertRaises(ValueError):list(sim_rows(io.StringIO('1;2;01-01-2021;310620;X950\n'),names))
        with self.assertRaises(ValueError):list(sim_rows(io.StringIO('1;2;01-01-2022;310620\n'),names))
    def test_sim_residence_and_basic_cause_not_occurrence_or_intervention(self):
        rows = [
            {'TIPOBITO':'2','CAUSABAS':'X950','CODMUNRES':'310620','CODMUNOCOR':'355030'},
            {'TIPOBITO':'2','CAUSABAS':'Y099','CODMUNRES':'355030'},
            {'TIPOBITO':'2','CAUSABAS':'Y350','CODMUNRES':'310620'},
            {'TIPOBITO':'1','CAUSABAS':'X850','CODMUNRES':'310620'},
            {'TIPOBITO':'2','CAUSABAS':'X840','CODMUNRES':'310620'},
            {'TIPOBITO':'2','CAUSABAS':'X850','CODMUNRES':'999999'},
        ]
        counts, audit = aggregate_aggressions(rows, {'310620':'3106200','355030':'3550308'})
        self.assertEqual(counts, {'3106200':1,'3550308':1})
        self.assertEqual(audit['unmatchedAggressions'], 1)
        self.assertEqual(audit['aggressions'], 3)
        self.assertEqual(mortality_rate(1, 20000), 5)
        self.assertEqual(mortality_rate(0, 20000), 0)
        self.assertIsNone(mortality_rate(1, None))
        self.assertIsNone(mortality_rate(1, 0))

    def test_official_gdp_period_and_code_crosswalk_preserve_missing(self):
        data = [{'id':47001,'res':[
            {'localidade':'310620','res':{'2021':'41854.36','2022':'49828.85'}},
            {'localidade':'355030','res':{'2022':None}},
        ]}]
        self.assertEqual(parse_gdp(data, {'310620':'3106200','355030':'3550308'}), {'3106200':49828.85,'3550308':None})
        with self.assertRaises(ValueError): parse_gdp([{'id':47002,'res':[]}], {})
        with self.assertRaises(ValueError): parse_gdp([{'id':47001,'res':[{'localidade':'310620','res':{'2022':'nan'}}]}], {'310620':'3106200'})


if __name__ == '__main__': unittest.main()
