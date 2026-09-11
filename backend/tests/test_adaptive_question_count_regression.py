import pytest
from apps.businesses.models import Business, BusinessProfileVersion
from common.enums import VariableOrigin
from domain.profile.variables import PROFILE_VARIABLES
from apps.onboarding.planner import plan_adaptive_smart_questions

@pytest.mark.django_db
def test_canonical_variable_registry_count():
    assert len(PROFILE_VARIABLES) >= 18
    keys = {pv.key for pv in PROFILE_VARIABLES}
    assert 'annual_turnover' in keys
    assert 'plant_machinery_investment' in keys
    assert 'total_worker_count' in keys
    assert 'contract_worker_count' in keys
    assert 'connected_power_load' in keys
    assert 'effluent_emission_generation' in keys
    assert 'import_export_intent' in keys

@pytest.mark.django_db
def test_adaptive_question_count_fresh_businesses(db, make_business, user):
    sectors = [
        ('Agro Processing Enterprise', 'Processing dehydrated organic onion powder, garlic flakes, and packaged agro spices'),
        ('Voltronics Electronics', 'PCB assembling, surface mount technology, and testing unit'),
        ('Aero Precision Components', 'CNC precision machined parts and automotive transmission gears'),
        ('BioCare MedTech', 'Medical disposables, diagnostic kits, and surgical implants'),
    ]
    
    for biz_name, prod_desc in sectors:
        biz = make_business(owner=user, name=biz_name)
        BusinessProfileVersion.objects.create(
            business=biz,
            version=1,
            variables={
                'state': {'value': 'MAHARASHTRA', 'origin': VariableOrigin.USER_PROVIDED},
                'product_description': {'value': prod_desc, 'origin': VariableOrigin.USER_PROVIDED},
            },
            created_by=user,
        )
        plan_res = plan_adaptive_smart_questions(biz, round_number=1)
        questions = plan_res.get('questions', [])
        assert len(questions) >= 15, f'Expected >= 15 questions for {biz_name}, got {len(questions)}'
        
        for q in questions:
            assert 'question_id' in q
            assert 'question_text' in q
            assert 'variable_id' in q
            assert 'answer_type' in q
            assert 'candidate_rules_count' in q
